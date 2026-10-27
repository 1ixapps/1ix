import React from "react";

/** Wani is Vanix's original page-building character. */
export default function BuilderCharacter({ className = "", decorative = true }) {
    return (
        <svg
            className={`builder-character ${className}`}
            viewBox="0 0 440 420"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role={decorative ? undefined : "img"}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : "وانی، کاراکتر صفحه‌ساز 1ix.ir"}
        >
            <circle cx="221" cy="209" r="151" fill="var(--wani-halo, #E8E8FF)" />
            <path d="M56 344H389" stroke="#17181B" strokeWidth="1.5" strokeDasharray="3 7" opacity=".3" />
            <ellipse cx="226" cy="376" rx="123" ry="11" fill="#17181B" opacity=".08" />
            <g stroke="#17181B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <g className="wani-tile">
                    <rect x="41" y="76" width="92" height="77" rx="13" fill="#17181B" transform="rotate(-12 41 76)" />
                    <rect x="37" y="71" width="92" height="77" rx="13" fill="#B8F7D4" transform="rotate(-12 37 71)" />
                    <path d="M56 91L103 81M59 103L83 98" />
                    <rect x="61" y="113" width="41" height="13" rx="4" fill="#4F46F7" transform="rotate(-12 61 113)" />
                </g>
                <path d="M124 238C82 243 57 204 68 154" strokeWidth="17" />
                <path d="M124 238C82 243 57 204 68 154" stroke="#FFB7AF" strokeWidth="12" />
                <path d="M76 151C82 142 83 132 75 128C71 126 66 130 65 135C64 123 55 120 51 127C46 137 55 155 65 157Z" fill="#FFFBF4" />
                <g className="wani-arm">
                    <path d="M321 240C365 238 388 204 371 170" strokeWidth="17" />
                    <path d="M321 240C365 238 388 204 371 170" stroke="#FFB7AF" strokeWidth="12" />
                    <path d="M366 169C356 164 355 153 363 149C370 146 376 149 379 156C382 165 377 171 366 169Z" fill="#FFFBF4" />
                    <path d="M369 154V140H350V123" strokeWidth="5" />
                    <rect x="325" y="103" width="62" height="27" rx="8" fill="#FF6B5E" />
                    <path d="M335 110H376" stroke="#FFB7AF" strokeWidth="3" />
                </g>
                <path d="M175 311L165 356M268 311L282 356" strokeWidth="18" />
                <path d="M175 311L165 356M268 311L282 356" stroke="#B8F7D4" strokeWidth="13" />
                <path d="M164 347C145 345 131 352 128 368H175C184 360 178 351 164 347Z" fill="#4F46F7" />
                <path d="M280 347C299 345 315 352 318 368H270C261 360 267 351 280 347Z" fill="#4F46F7" />
                <path d="M128 368H175M270 368H318" stroke="#FFFBF4" strokeWidth="3" />
                <rect x="117" y="135" width="215" height="185" rx="29" fill="#17181B" />
                <rect x="110" y="128" width="215" height="185" rx="29" fill="#4F46F7" />
                <path d="M139 128H296C312 128 325 141 325 157V169H110V157C110 141 123 128 139 128Z" fill="#FFD84D" />
                <path d="M110 169H325" />
                <circle cx="132" cy="149" r="4" fill="#FF6B5E" strokeWidth="1.5" />
                <circle cx="147" cy="149" r="4" fill="#FFFBF4" strokeWidth="1.5" />
                <path d="M274 149H301" strokeWidth="3" />
                <rect x="128" y="186" width="180" height="106" rx="19" fill="#FFFBF4" />
                <g className="wani-eyes" strokeWidth="0" fill="#17181B">
                    <rect x="166" y="207" width="13" height="23" rx="6.5" />
                    <rect x="253" y="207" width="13" height="23" rx="6.5" />
                </g>
                <path d="M203 236C210 245 223 245 230 236" strokeWidth="3.5" />
                <path d="M151 240H162M272 240H283" stroke="#FFB7AF" strokeWidth="5" />
                <rect x="150" y="263" width="40" height="13" rx="4" fill="#B8F7D4" strokeWidth="1.5" />
                <rect x="198" y="263" width="40" height="13" rx="4" fill="#FFB7AF" strokeWidth="1.5" />
                <rect x="246" y="263" width="40" height="13" rx="4" fill="#FFD84D" strokeWidth="1.5" />
                <g className="wani-cursor">
                    <path d="M313 268L319 318L332 305L346 324L358 315L344 297L361 291Z" fill="#17181B" />
                    <path d="M308 263L314 313L327 300L341 319L353 310L339 292L356 286Z" fill="#FFFBF4" />
                </g>
                <path d="M216 55L222 72L239 78L222 84L216 101L210 84L193 78L210 72Z" fill="#FFD84D" strokeWidth="1.7" />
                <circle cx="361" cy="71" r="10" fill="#B8F7D4" strokeWidth="1.7" />
                <path d="M47 283H64M55.5 274.5V291.5" strokeWidth="2" />
            </g>
        </svg>
    );
}
