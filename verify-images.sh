#!/usr/bin/env bash
#
# verify-images.sh — Batch-3 Cloudinary image round-trip check.
# Run in a NORMAL terminal (NOT the agent sandbox) against a server YOU start:
#     npm run dev          # in one terminal (with real CLOUDINARY_* + JWT_* in .env)
#     ./verify-images.sh    # in another
#
# Optional args:
#   $1 = base URL   (default http://localhost:5000/api)
#   $2 = image path (default ./verify-sample.png; auto-created via ImageMagick)
#
# NOT committed. Exits non-zero if any step fails.
set -u

BASE="${1:-http://localhost:5000/api}"
IMG="${2:-./verify-sample.png}"
IMG2="./verify-sample-2.png"
EMAIL="admin@erp.test"
PASSWORD="Password123!"
JAR="$(mktemp)"
SKU="VERIFY-$(date +%s)"
FAILED=0

pass() { echo "  ✅ PASS — $1"; }
fail() { echo "  ❌ FAIL — $1"; FAILED=1; }

# --- helpers -----------------------------------------------------------------
# json <file> <node-expr on parsed `o`>
json() { node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1]));process.stdout.write(String(($2)))" "$1" 2>/dev/null; }

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required tool: $1"; exit 2; }; }
need curl
need node

# --- test images -------------------------------------------------------------
make_img() { # $1 path, $2 color
  if command -v magick >/dev/null 2>&1; then magick -size 64x64 "xc:$2" "$1"
  elif command -v convert >/dev/null 2>&1; then convert -size 64x64 "xc:$2" "$1"
  else return 1; fi
}
if [ ! -f "$IMG" ]; then
  make_img "$IMG" red || { echo "No ImageMagick and no image at $IMG — pass an image path as \$2."; exit 2; }
  echo "Created test image: $IMG"
fi
make_img "$IMG2" blue || cp "$IMG" "$IMG2"   # fall back to same file if IM absent

echo "Base: $BASE | SKU: $SKU | image: $IMG"
echo

# --- 0) login ----------------------------------------------------------------
echo "0) login $EMAIL"
LOGIN_CODE=$(curl -s -c "$JAR" -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$LOGIN_CODE" = "200" ] && pass "login 200" || { fail "login returned $LOGIN_CODE"; exit 1; }

# --- 1) create with image ----------------------------------------------------
echo "1) POST /products (fields + image) → expect 201"
CREATE="$(mktemp)"
CODE=$(curl -s -b "$JAR" -o "$CREATE" -w '%{http_code}' -X POST "$BASE/products" \
  -F 'name=Verify Widget' -F "sku=$SKU" -F 'category=Tools' \
  -F 'purchasePrice=12.50' -F 'sellingPrice=24.99' -F 'stockQuantity=7' \
  -F "image=@$IMG;type=image/png")
[ "$CODE" = "201" ] && pass "create 201" || fail "create returned $CODE"
PID=$(json "$CREATE" "o.data._id")
URL1=$(json "$CREATE" "o.data.image.url")
PUB1=$(json "$CREATE" "o.data.image.publicId")
echo "     _id=$PID"
echo "     image.publicId=$PUB1"
echo "     image.url=$URL1"
case "$PUB1" in
  personal/mini-erp/products/"$PID") pass "publicId == personal/mini-erp/products/<_id>";;
  *) fail "publicId path/_id mismatch";;
esac
UCODE=$(curl -s -o /dev/null -w '%{http_code}' -I "$URL1")
[ "$UCODE" = "200" ] && pass "image URL loads (HTTP 200)" || fail "image URL returned $UCODE"

# --- 2) update with a NEW image → same publicId/url --------------------------
echo "2) PATCH /products/:id (new image) → expect same publicId & url"
UPDATE="$(mktemp)"
CODE=$(curl -s -b "$JAR" -o "$UPDATE" -w '%{http_code}' -X PATCH "$BASE/products/$PID" \
  -F 'sellingPrice=29.99' -F "image=@$IMG2;type=image/png")
[ "$CODE" = "200" ] && pass "update 200" || fail "update returned $CODE"
PUB2=$(json "$UPDATE" "o.data.image.publicId")
URL2=$(json "$UPDATE" "o.data.image.url")
[ "$PUB1" = "$PUB2" ] && pass "publicId stable after replace" || fail "publicId changed: $PUB1 -> $PUB2"
# URL identical ignoring the /v<version>/ cache-buster segment
if [ "$(printf '%s' "$URL1" | sed -E 's#/v[0-9]+/#/#')" = "$(printf '%s' "$URL2" | sed -E 's#/v[0-9]+/#/#')" ]; then
  pass "url stable (ignoring version segment)"
else
  fail "url base changed: $URL1 -> $URL2"
fi
UCODE=$(curl -s -o /dev/null -w '%{http_code}' -I "$URL2")
[ "$UCODE" = "200" ] && pass "replaced image URL loads (HTTP 200)" || fail "replaced URL returned $UCODE"

# --- 3) GET → url unchanged --------------------------------------------------
echo "3) GET /products/:id → url unchanged"
GET="$(mktemp)"
curl -s -b "$JAR" -o "$GET" "$BASE/products/$PID" >/dev/null
URL3=$(json "$GET" "o.data.image.url")
[ "$URL3" = "$URL2" ] && pass "persisted url matches update" || fail "persisted url differs: $URL2 -> $URL3"

# --- 4) duplicate SKU → dup-key status ---------------------------------------
echo "4) POST duplicate SKU ($SKU) → expect 409"
CODE=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' -X POST "$BASE/products" \
  -F 'name=Dupe' -F "sku=$SKU" -F 'category=Tools' \
  -F 'purchasePrice=1' -F 'sellingPrice=2' -F 'stockQuantity=1' \
  -F "image=@$IMG;type=image/png")
[ "$CODE" = "409" ] && pass "duplicate SKU rejected (409)" || fail "duplicate SKU returned $CODE (expected 409)"

# --- 5) delete ---------------------------------------------------------------
echo "5) DELETE /products/:id → expect 200, then asset gone"
CODE=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' -X DELETE "$BASE/products/$PID")
[ "$CODE" = "200" ] && pass "delete 200" || fail "delete returned $CODE"
GCODE=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/products/$PID")
[ "$GCODE" = "404" ] && pass "product gone (GET 404)" || fail "GET after delete returned $GCODE"
# unversioned url should 404 once the asset is destroyed (best-effort)
DCODE=$(curl -s -o /dev/null -w '%{http_code}' -I "$(printf '%s' "$URL2" | sed -E 's#/v[0-9]+/#/#')")
[ "$DCODE" = "404" ] && pass "Cloudinary asset destroyed (unversioned URL 404)" \
  || echo "  ℹ️  unversioned URL returned $DCODE (destroy is best-effort / CDN cache may linger)"

# --- cleanup temp images if we created them ----------------------------------
rm -f "$IMG2" "$CREATE" "$UPDATE" "$GET" "$JAR"

echo
if [ "$FAILED" -eq 0 ]; then echo "RESULT: ✅ ALL STEPS PASSED"; else echo "RESULT: ❌ ONE OR MORE STEPS FAILED"; fi
exit "$FAILED"
