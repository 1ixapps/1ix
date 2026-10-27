import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import WorkingHoursEditor from "./WorkingHoursEditor";
import BusinessHours from "./BusinessHours";
import { readFileSync } from "fs";
import { join } from "path";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const schedule = [
  { day: "friday", enabled: false, open_time: "10:00", close_time: "14:00" },
  { day: "saturday", enabled: true, open_time: "09:00", close_time: "18:00" },
];
let host; let root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const edit = (input, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

test("an empty schedule is not silently invented and setup is an explicit action", () => {
  const change = jest.fn();
  act(() => root.render(<WorkingHoursEditor hours={[]} onChange={change} />));
  expect(change).not.toHaveBeenCalled();
  expect(host.textContent).toContain("هنوز ساعت کاری تنظیم نکرده‌ای");
  act(() => host.querySelector("button").click());
  expect(change).toHaveBeenCalledTimes(1);
  const days = change.mock.calls[0][0];
  expect(days).toHaveLength(7);
  expect(days.filter((day) => day.enabled)).toHaveLength(6);
  expect(days.find((day) => day.day === "friday").enabled).toBe(false);
});

test("sorting display days preserves their original indexes and disabled time values", () => {
  const change = jest.fn();
  function Harness() {
    const [hours, setHours] = useState(schedule);
    return <WorkingHoursEditor hours={hours} onChange={(next) => { change(next); setHours(next); }} />;
  }
  act(() => root.render(<Harness />));
  expect(host.querySelector(".wh-day").dataset.testid).toBe("working-day-saturday");
  const saturday = host.querySelector('[data-testid="working-day-saturday"]');
  expect(saturday.querySelectorAll("input[type=time]")).toHaveLength(2);
  act(() => saturday.querySelector('[role="switch"]').click());
  expect(saturday.textContent).toContain("تعطیل");
  expect(saturday.querySelector("input[type=time]")).toBeNull();
  const closed = change.mock.calls[0][0];
  expect(closed[0]).toEqual(schedule[0]);
  expect(closed[1]).toEqual({ ...schedule[1], enabled: false });
  act(() => saturday.querySelector('[role="switch"]').click());
  expect(saturday.querySelector('input[aria-label="شروع کار شنبه"]').value).toBe("09:00");
  expect(schedule[1].enabled).toBe(true);
});

test("labeled time controls update actual values and show backend-compatible range errors", () => {
  function Harness() {
    const [hours, setHours] = useState([schedule[1]]);
    return <WorkingHoursEditor hours={hours} onChange={setHours} />;
  }
  act(() => root.render(<Harness />));
  const start = host.querySelector('[aria-label="شروع کار شنبه"]');
  const end = host.querySelector('[aria-label="پایان کار شنبه"]');
  expect(host.querySelector(`label[for="${start.id}"]`).textContent).toBe("از ساعت");
  edit(end, "08:00");
  expect(end.value).toBe("08:00");
  expect(end.getAttribute("aria-invalid")).toBe("true");
  expect(host.querySelector('[role="alert"]').textContent).toContain("ساعت پایان باید بعد از ساعت شروع باشد");
  edit(end, "17:15");
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(end.getAttribute("aria-invalid")).toBe("false");
});

test("public hours use Persian numerals, chronological week order and explicit closed days", () => {
  act(() => root.render(<BusinessHours hours={schedule} />));
  const rows = [...host.querySelectorAll(".bp-hours li")];
  expect(rows).toHaveLength(2);
  expect(rows[0].textContent).toContain("شنبه");
  expect(rows[0].textContent).toContain("از۰۹:۰۰تا۱۸:۰۰");
  expect(rows[0].querySelector("time").getAttribute("datetime")).toBe("09:00");
  expect(rows[1].textContent).toContain("جمعه");
  expect(rows[1].textContent).toContain("تعطیل");
  expect(rows[1].querySelector("time")).toBeNull();
  expect(host.querySelector("button")).toBeNull();
});

test("missing or malformed public times have a clear fallback instead of dangling separators", () => {
  act(() => root.render(<BusinessHours hours={[{ day: "monday", enabled: true, open_time: "", close_time: "" }]} />));
  expect(host.textContent).toContain("ساعت مشخص نشده");
  expect(host.querySelector("time")).toBeNull();
  act(() => root.render(<BusinessHours hours={[]} />));
  expect(host.childNodes).toHaveLength(0);
});

test("time inputs adapt to the actual editor width rather than cramped fixed columns", () => {
  const css = readFileSync(join(__dirname, "../styles/working-hours.css"), "utf8");
  expect(css).toContain("container: working-hours / inline-size");
  expect(css).toContain("@container working-hours (max-width: 310px)");
  expect(css).toContain("minmax(0, 1fr)");
  expect(css).toContain("font-size: 16px");
});
