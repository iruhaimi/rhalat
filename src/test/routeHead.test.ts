import { describe, expect, it } from "vitest";
import { countryPreviewText, pageHead } from "@/lib/routeHead";

describe("page share previews", () => {
  it("points the canonical link and share URL at the page itself", () => {
    const head = pageHead({ title: "من نحن", description: "وصف", path: "/about" });
    expect(head.links).toEqual([{ rel: "canonical", href: "https://visafaster.com/about" }]);
    expect(head.meta).toContainEqual({ property: "og:url", content: "https://visafaster.com/about" });
    expect(head.meta).toContainEqual({ property: "og:title", content: "من نحن" });
  });

  it("builds a country preview from its cheapest price and fastest processing time", () => {
    const preview = countryPreviewText(
      { name: "فرنسا", seo_title: null, seo_description: null },
      [{ price: 900, processing_days: 15 }, { price: 650, processing_days: 10 }],
    );
    expect(preview.title).toBe("تأشيرة فرنسا — الشروط والأسعار | عطلات رحلاتكم");
    expect(preview.description).toContain("2 نوع تأشيرة");
    expect(preview.description).toContain("تبدأ من 650 ر.س");
    expect(preview.description).toContain("معالجة خلال 10 أيام");
  });
});
