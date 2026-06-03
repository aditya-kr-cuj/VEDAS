#!/bin/bash
# VEDAS E2E Test Suite — macOS compatible
API="http://localhost:4000/api/v1"
PASS=0
FAIL=0
RESULTS=""

test_result() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    PASS=$((PASS + 1))
    RESULTS="${RESULTS}\n✅ $name"
  else
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}\n❌ $name (expected: $expected)"
  fi
}

call_api() {
  local method="$1"; local url="$2"; local data="$3"; local token="$4"
  local tmpfile=$(mktemp)
  if [ -n "$data" ]; then
    HTTP_CODE=$(curl -s -o "$tmpfile" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" ${token:+-H "Authorization: Bearer $token"} -d "$data")
  else
    HTTP_CODE=$(curl -s -o "$tmpfile" -w "%{http_code}" -X "$method" "$url" \
      ${token:+-H "Authorization: Bearer $token"})
  fi
  HTTP_BODY=$(cat "$tmpfile"); rm -f "$tmpfile"
}

jq_get() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print($2)" 2>/dev/null || echo ""; }

echo "=========================================="
echo "  VEDAS COMPREHENSIVE E2E TEST SUITE"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# ── TEST SUITE 1: Public Website Pages ────────────
echo ""
echo "━━━ SUITE 1: Public Website ━━━"
for page in "" "features" "pricing" "about" "contact" "login-options" "register"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/$page")
  label="/$page"; [ -z "$page" ] && label="/"
  test_result "1.1 Public $label loads" "200" "$code"
  echo "  $label → $code"
done

# ── TEST SUITE 2: Institute Registration ──────────
echo ""
echo "━━━ SUITE 2: Registration ━━━"
call_api POST "$API/auth/register-institute" \
  '{"instituteName":"Test Academy","instituteSlug":"test-academy","ownerName":"Test Admin","ownerEmail":"admin@testacademy.com","password":"TestPass123","ownerPhone":"9876543210"}'
echo "  Register: HTTP $HTTP_CODE"
test_result "2.1 Register new institute" "201" "$HTTP_CODE"

TENANT_CODE=$(jq_get "$HTTP_BODY" "d.get('tenant',{}).get('tenantCode','')")
echo "  Tenant Code: $TENANT_CODE"
if [ -n "$TENANT_CODE" ] && [ "$TENANT_CODE" != "" ] && [ "$TENANT_CODE" != "None" ]; then
  test_result "2.2 Tenant code auto-generated" "ok" "ok"
else
  test_result "2.2 Tenant code auto-generated" "code" "empty"
  # Fallback: try with existing institute
  TENANT_CODE="TPH-NAY"
  echo "  ⚠ Using fallback tenant code: $TENANT_CODE"
fi

# ── TEST SUITE 3: Super Admin ─────────────────────
echo ""
echo "━━━ SUITE 3: Super Admin ━━━"
call_api POST "$API/auth/login" '{"email":"superadmin@vedas.io","password":"ChangeMe123"}'
SA_ROLE=$(jq_get "$HTTP_BODY" "d.get('user',{}).get('role','')")
SA_TOKEN=$(jq_get "$HTTP_BODY" "d.get('tokens',{}).get('accessToken','')")
echo "  Login: HTTP $HTTP_CODE, role=$SA_ROLE"
test_result "3.1 SA login (no tenant code)" "200" "$HTTP_CODE"
test_result "3.1b Role = super_admin" "super_admin" "$SA_ROLE"

call_api GET "$API/super-admin/dashboard/stats" "" "$SA_TOKEN"
echo "  Dashboard stats: HTTP $HTTP_CODE"
test_result "3.2 Dashboard stats" "200" "$HTTP_CODE"

call_api GET "$API/super-admin/institutes" "" "$SA_TOKEN"
echo "  Institutes: HTTP $HTTP_CODE"
test_result "3.3 List institutes" "200" "$HTTP_CODE"

# ── TEST SUITE 4: Institute Admin Login ───────────
echo ""
echo "━━━ SUITE 4: Institute Admin Login ━━━"
call_api POST "$API/auth/login" "{\"email\":\"admin@testacademy.com\",\"password\":\"TestPass123\",\"tenantCode\":\"$TENANT_CODE\"}"
ADMIN_ROLE=$(jq_get "$HTTP_BODY" "d.get('user',{}).get('role','')")
ADMIN_TOKEN=$(jq_get "$HTTP_BODY" "d.get('tokens',{}).get('accessToken','')")
echo "  Correct code: HTTP $HTTP_CODE, role=$ADMIN_ROLE"
test_result "4.1 Admin login with tenant code" "200" "$HTTP_CODE"

call_api POST "$API/auth/login" '{"email":"admin@testacademy.com","password":"TestPass123","tenantCode":"WRONG-XYZ"}'
echo "  Wrong code: HTTP $HTTP_CODE"
test_result "4.2 Wrong institute code rejected" "401" "$HTTP_CODE"

call_api POST "$API/auth/login" '{"email":"admin@testacademy.com","password":"TestPass123"}'
echo "  No code: HTTP $HTTP_CODE"
test_result "4.3 Missing tenant code rejected" "400" "$HTTP_CODE"

call_api POST "$API/auth/login" "{\"email\":\"nonexist@test.com\",\"password\":\"TestPass123\",\"tenantCode\":\"$TENANT_CODE\"}"
echo "  Wrong email: HTTP $HTTP_CODE"
test_result "4.4 Wrong email rejected" "401" "$HTTP_CODE"

call_api POST "$API/auth/login" "{\"email\":\"admin@testacademy.com\",\"password\":\"WrongPass1\",\"tenantCode\":\"$TENANT_CODE\"}"
echo "  Wrong password: HTTP $HTTP_CODE"
test_result "4.5 Wrong password rejected" "401" "$HTTP_CODE"

# ── TEST SUITE 5: Student & Teacher ───────────────
echo ""
echo "━━━ SUITE 5: Student & Teacher ━━━"
if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "" ]; then
  call_api POST "$API/auth/student" '{"fullName":"John Student","email":"john@student.com","password":"Student1234"}' "$ADMIN_TOKEN"
  echo "  Create student: HTTP $HTTP_CODE"
  test_result "5.1 Create student" "201" "$HTTP_CODE"

  call_api POST "$API/auth/teacher" '{"fullName":"Jane Teacher","email":"jane@teacher.com","password":"Teacher1234"}' "$ADMIN_TOKEN"
  echo "  Create teacher: HTTP $HTTP_CODE"
  test_result "5.3 Create teacher" "201" "$HTTP_CODE"

  call_api POST "$API/auth/login" "{\"email\":\"john@student.com\",\"password\":\"Student1234\",\"tenantCode\":\"$TENANT_CODE\"}"
  STU_ROLE=$(jq_get "$HTTP_BODY" "d.get('user',{}).get('role','')")
  echo "  Student login: HTTP $HTTP_CODE, role=$STU_ROLE"
  test_result "5.2 Student login" "200" "$HTTP_CODE"
  test_result "5.2b Student role = student" "student" "$STU_ROLE"

  call_api POST "$API/auth/login" "{\"email\":\"jane@teacher.com\",\"password\":\"Teacher1234\",\"tenantCode\":\"$TENANT_CODE\"}"
  TCH_ROLE=$(jq_get "$HTTP_BODY" "d.get('user',{}).get('role','')")
  echo "  Teacher login: HTTP $HTTP_CODE, role=$TCH_ROLE"
  test_result "5.4 Teacher login" "200" "$HTTP_CODE"
  test_result "5.4b Teacher role = teacher" "teacher" "$TCH_ROLE"
else
  echo "  ⚠ Skipping — no admin token"
  for t in "5.1 Create student" "5.3 Create teacher" "5.2 Student login" "5.2b Student role" "5.4 Teacher login" "5.4b Teacher role"; do
    test_result "$t" "skip" "no-token"
  done
fi

# ── TEST SUITE 6: Multi-Tenant Isolation ──────────
echo ""
echo "━━━ SUITE 6: Multi-Tenant Isolation ━━━"
call_api POST "$API/auth/register-institute" \
  '{"instituteName":"ABC Classes","instituteSlug":"abc-classes","ownerName":"ABC Admin","ownerEmail":"admin@abcclasses.com","password":"ABCPass1234","ownerPhone":"9876543211"}'
TENANT2_CODE=$(jq_get "$HTTP_BODY" "d.get('tenant',{}).get('tenantCode','')")
echo "  Register 2nd: HTTP $HTTP_CODE, code=$TENANT2_CODE"
test_result "6.1 Register second institute" "201" "$HTTP_CODE"

if [ -n "$TENANT2_CODE" ] && [ "$TENANT2_CODE" != "" ] && [ "$TENANT2_CODE" != "None" ]; then
  call_api POST "$API/auth/login" "{\"email\":\"john@student.com\",\"password\":\"Student1234\",\"tenantCode\":\"$TENANT2_CODE\"}"
  echo "  Cross-institute student: HTTP $HTTP_CODE"
  test_result "6.3 Cross-institute login blocked" "401" "$HTTP_CODE"

  call_api POST "$API/auth/login" "{\"email\":\"admin@testacademy.com\",\"password\":\"TestPass123\",\"tenantCode\":\"$TENANT2_CODE\"}"
  echo "  Cross-institute admin: HTTP $HTTP_CODE"
  test_result "6.3b Cross-institute admin blocked" "401" "$HTTP_CODE"
else
  echo "  ⚠ Skipping cross-tenant tests — no 2nd code"
  test_result "6.3 Cross-institute login blocked" "skip" "no-code"
  test_result "6.3b Cross-institute admin blocked" "skip" "no-code"
fi

# ── TEST SUITE 7: Frontend Pages & Links ──────────
echo ""
echo "━━━ SUITE 7: Frontend & Navigation ━━━"
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/portal-login")
echo "  Portal login: $code"
test_result "7.0 Portal login page" "200" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/login")
echo "  Admin login: $code"
test_result "7.1 Admin login page" "200" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/login")
echo "  SA login: $code"
test_result "7.2 Super Admin login page" "200" "$code"

PORTAL_HTML=$(curl -s "http://localhost:3000/portal-login")
echo "$PORTAL_HTML" | grep -q "Institute Admin Login" && test_result "7.3 Portal→Admin link" "ok" "ok" || test_result "7.3 Portal→Admin link" "link" "missing"

ADMIN_HTML=$(curl -s "http://localhost:3000/login")
echo "$ADMIN_HTML" | grep -q "portal-login" && test_result "7.4 Admin→Portal link" "ok" "ok" || test_result "7.4 Admin→Portal link" "link" "missing"

OPTIONS_HTML=$(curl -s "http://localhost:3001/login-options")
echo "$OPTIONS_HTML" | grep -q "portal-login" && test_result "7.5 Options→Portal link" "ok" "ok" || test_result "7.5 Options→Portal link" "link" "missing"
echo "$OPTIONS_HTML" | grep -q "super-admin" && test_result "7.6 Options→SA link" "ok" "ok" || test_result "7.6 Options→SA link" "link" "missing"

# ── TEST SUITE 8: Theme Checks ────────────────────
echo ""
echo "━━━ SUITE 8: Theme Consistency ━━━"
SA_HTML=$(curl -s "http://localhost:3002/login")
echo "$SA_HTML" | grep -q "purple" && test_result "8.1 SA purple theme" "ok" "ok" || test_result "8.1 SA purple theme" "theme" "missing"

echo "$ADMIN_HTML" | grep -q "f4b860\|gold" && test_result "8.2 Admin gold theme" "ok" "ok" || test_result "8.2 Admin gold theme" "theme" "missing"

echo "$PORTAL_HTML" | grep -q "86e3ce\|teal" && test_result "8.3 Portal teal theme" "ok" "ok" || test_result "8.3 Portal teal theme" "theme" "missing"

echo ""
echo "=========================================="
echo "  FINAL REPORT"
echo "=========================================="
echo -e "$RESULTS"
echo ""
TOTAL=$((PASS + FAIL))
PERCENT=$(( (PASS * 100) / TOTAL ))
echo "=========================================="
printf "  %-12s %d\n" "Passed:" $PASS
printf "  %-12s %d\n" "Failed:" $FAIL
printf "  %-12s %d\n" "Total:" $TOTAL
printf "  %-12s %d%%\n" "Score:" $PERCENT
echo "=========================================="
