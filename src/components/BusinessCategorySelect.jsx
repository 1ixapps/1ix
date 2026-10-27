import React from "react";
import { Stethoscope, Brain, Hospital, Scissors, BriefcaseBusiness, GraduationCap, Coffee, Store, HandHeart, Shapes, LayoutTemplate } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

export const BUSINESS_CATEGORIES = [
  { value: "پزشک", icon: Stethoscope, group: "سلامت و زیبایی", template: "doctor", tone: "sky" },
  { value: "روانشناس / مشاور", icon: Brain, group: "سلامت و زیبایی", template: "psychologist", tone: "violet" },
  { value: "کلینیک / مرکز درمانی", icon: Hospital, group: "سلامت و زیبایی", template: "clinic", tone: "mint" },
  { value: "آرایشگاه / سالن زیبایی", icon: Scissors, group: "سلامت و زیبایی", template: "salon", tone: "rose" },
  { value: "فریلنسر", icon: BriefcaseBusiness, group: "کسب‌وکار و خدمات", template: "freelancer", tone: "violet" },
  { value: "آموزشگاه", icon: GraduationCap, group: "کسب‌وکار و خدمات", template: "academy", tone: "sky" },
  { value: "رستوران / کافه", icon: Coffee, group: "کسب‌وکار و خدمات", template: "restaurant", tone: "amber" },
  { value: "فروشگاه", icon: Store, group: "کسب‌وکار و خدمات", tone: "mint" },
  { value: "خدمات شخصی", icon: HandHeart, group: "کسب‌وکار و خدمات", tone: "rose" },
  { value: "سایر", icon: Shapes, group: "کسب‌وکار و خدمات", tone: "neutral" },
];

export function templateCategory(templateId) {
  return BUSINESS_CATEGORIES.find((item) => item.template === templateId) || { icon: LayoutTemplate, tone: "neutral" };
}

export default function BusinessCategorySelect({ value, onValueChange, id, testId }) {
  const current = BUSINESS_CATEGORIES.find((item) => item.value === value);
  const Icon = current?.icon || Shapes;
  return (
    <Select dir="rtl" value={value || ""} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="builder-category-trigger mt-1.5" data-testid={testId}>
        <SelectValue placeholder="زمینهٔ فعالیتت را انتخاب کن">
          {value ? <span className="builder-category-value"><Icon size={18} aria-hidden="true" /><span>{value}</span></span> : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="builder-category-menu" sideOffset={6} collisionPadding={12}>
        {["سلامت و زیبایی", "کسب‌وکار و خدمات"].map((group) => (
          <SelectGroup key={group}>
            <SelectLabel className="builder-category-group">{group}</SelectLabel>
            {BUSINESS_CATEGORIES.filter((item) => item.group === group).map(({ value: category, icon: CategoryIcon, tone }) => (
              <SelectItem key={category} value={category} className="builder-category-option">
                <span className="builder-category-value">
                  <span className={`builder-category-icon is-${tone}`} aria-hidden="true"><CategoryIcon size={18} /></span>
                  <span>{category}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
