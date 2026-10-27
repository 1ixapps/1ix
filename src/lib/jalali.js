// Jalali (Persian) calendar conversion helpers.
// Uses the well-known algorithm from Behnam Sabaghian's jalaali-js (public domain logic),
// inlined to avoid a tiny extra dependency.

/* eslint-disable */
function div(a, b) {
    return ~~(a / b);
}

function toJalaali(gy, gm, gd) {
    return d2j(g2d(gy, gm, gd));
}

function toGregorian(jy, jm, jd) {
    return d2g(j2d(jy, jm, jd));
}

function jalCal(jy) {
    const breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
        1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
    ];
    let bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0];
    if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalaali year " + jy);
    let jump;
    for (let i = 1; i < bl; i++) {
        const jm = breaks[i];
        jump = jm - jp;
        if (jy < jm) break;
        leapJ = leapJ + div(jump, 33) * 8 + div(jump % 33, 4);
        jp = jm;
    }
    let n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
    if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    let leap = (((n + 1) % 33) - 1) % 4;
    if (leap === -1) leap = 4;
    return { leap, gy, march };
}

function j2d(jy, jm, jd) {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let k = jdn - jdn1f;
    if (k >= 0) {
        if (k <= 185) {
            const jm = 1 + div(k, 31);
            const jd = (k % 31) + 1;
            return { jy, jm, jd };
        }
        k -= 186;
    } else {
        jy -= 1;
        k += 179;
        if (r.leap === 1) k += 1;
    }
    const jm = 7 + div(k, 30);
    const jd = (k % 30) + 1;
    return { jy, jm, jd };
}

function g2d(gy, gm, gd) {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
        div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
}

function d2g(jdn) {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(j % 1461, 4) * 5 + 308;
    const gd = div(i % 153, 5) + 1;
    const gm = (div(i, 153) % 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const FA_TO_EN_DIGITS = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};
const PERSIAN_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const PERSIAN_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

export function toFarsiDigits(n) {
    return String(n).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}

function pad2(n) {
    return String(n).padStart(2, "0");
}

export function toEnglishDigits(value) {
    return String(value).replace(/[۰-۹٠-٩]/g, (digit) => FA_TO_EN_DIGITS[digit] || digit);
}

function numberFromDateObjectPart(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(toEnglishDigits(value));
    if (value && typeof value.number === "number") return value.number;
    if (value && typeof value.index === "number") return value.index + 1;
    return NaN;
}

// ISO yyyy-mm-dd -> { jy, jm, jd }
export function isoToJalali(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return toJalaali(y, m, d);
}

// Returns "۱۴۰۴/۱۲/۱۵" given ISO yyyy-mm-dd
export function formatJalaliDate(iso, { withWeekday = false, monthName = false } = {}) {
    const j = isoToJalali(iso);
    if (!j) return iso || "";
    if (monthName) {
        const wd = withWeekday ? PERSIAN_WEEKDAYS[new Date(iso).getDay()] + " " : "";
        return `${wd}${toFarsiDigits(j.jd)} ${PERSIAN_MONTHS[j.jm - 1]} ${toFarsiDigits(j.jy)}`;
    }
    return `${toFarsiDigits(j.jy)}/${toFarsiDigits(pad2(j.jm))}/${toFarsiDigits(pad2(j.jd))}`;
}

// Format ISO datetime -> Jalali date + time string
export function formatJalaliDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toFarsiDigits(j.jy)}/${toFarsiDigits(pad2(j.jm))}/${toFarsiDigits(pad2(j.jd))} ${toFarsiDigits(pad2(d.getHours()))}:${toFarsiDigits(pad2(d.getMinutes()))}`;
}

// jy, jm, jd -> ISO yyyy-mm-dd
export function jalaliToIso(jy, jm, jd) {
    const g = toGregorian(jy, jm, jd);
    return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

// react-multi-date-picker uses DateObject.format() with "YYYY-MM-DD" returning Persian digits;
// helper to convert any "YYYY-MM-DD" (possibly with Persian digits) to ISO using gregorian.
export function dateObjectToIso(dateObject) {
    if (!dateObject) return "";
    if (typeof dateObject === "string") {
        const parts = toEnglishDigits(dateObject).split(/[/-]/).map(Number);
        if (parts.length === 3 && parts.every(Boolean)) {
            const [y, m, d] = parts;
            return y < 1700 ? jalaliToIso(y, m, d) : `${y}-${pad2(m)}-${pad2(d)}`;
        }
    }
    // In the Persian picker, read the selected Jalali parts directly. This avoids
    // DateObject.toDate() timezone/calendar edge cases that can fall back to today.
    const jy = numberFromDateObjectPart(dateObject.year);
    const jm = numberFromDateObjectPart(dateObject.month);
    const jd = numberFromDateObjectPart(dateObject.day);
    if (jy && jm && jd) return jalaliToIso(jy, jm, jd);

    const gd = dateObject.toDate ? dateObject.toDate() : new Date(dateObject);
    const y = gd.getFullYear();
    const m = pad2(gd.getMonth() + 1);
    const d = pad2(gd.getDate());
    return `${y}-${m}-${d}`;
}
