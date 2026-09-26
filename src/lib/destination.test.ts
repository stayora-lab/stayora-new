import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AMENITIES,
  AMENITIES_FREE,
  AMENITIES_PAID,
  DESTINATION_COPY,
  GUEST_ARRIVAL,
  AMENITY_CARDS,
  GYM_PHOTOS,
  HERO_SLIDES,
  HERO_SUBTITLE,
  HERO_TITLE,
  LOCATION_LABEL,
} from "./destination.ts";
import { PHOTO_CATALOG } from "./photos.ts";
import { villas } from "./villas.ts";

const FORBIDDEN =
  /beach club|quán bar|shuttle|xe đưa đón|xe điện|lễ tân|sảnh lễ|5\s*sao|sang trọng|đánh giá|Bà Rịa|Đất Đỏ|review/i;

function marketingCopy(): string[] {
  return [
    DESTINATION_COPY.namePlace.title,
    DESTINATION_COPY.namePlace.body,
    DESTINATION_COPY.about.title,
    DESTINATION_COPY.about.body,
    DESTINATION_COPY.around.title,
    DESTINATION_COPY.around.body,
    DESTINATION_COPY.arrival.title,
    DESTINATION_COPY.arrival.body,
    GUEST_ARRIVAL,
    LOCATION_LABEL,
    HERO_TITLE,
    HERO_SUBTITLE,
    ...HERO_SLIDES.map((slide) => slide.alt),
    ...HERO_SLIDES.map((slide) => slide.caption),
  ];
}

describe("destination copy", () => {
  it("uses the founder blocks exactly", () => {
    assert.equal(HERO_TITLE, "Oceanami, Phước Hải");
    assert.equal(
      HERO_SUBTITLE,
      "Biển Phước Hải phía trước, núi Minh Đạm phía sau. Đặt villa trực tiếp với các chủ nhà tại Oceanami qua Stayora.",
    );
    assert.equal(DESTINATION_COPY.about.title, "Về điểm đến");
    assert.equal(
      DESTINATION_COPY.about.body,
      "Oceanami là khu nghỉ dưỡng rộng hơn 22 hecta trên bờ biển Phước Hải, gần Long Hải, cách TP.HCM khoảng 2–3 giờ đi xe tuỳ giao thông. Mở cửa từ năm 2017, khu có 351 villa, quay mặt ra biển và tựa lưng vào dãy Minh Đạm. Mỗi mùa xuân, hàng cây hoa trong khu nhuộm hồng cả sườn đồi.",
    );
    assert.equal(DESTINATION_COPY.around.title, "Quanh khu nghỉ dưỡng");
    assert.equal(
      DESTINATION_COPY.around.body,
      "Làng chài Phước Hải, Dinh Cô Long Hải, núi Minh Đạm, chợ Long Hải và các quán cà phê ven biển đều chỉ cách vài phút.",
    );
    assert.equal(DESTINATION_COPY.arrival.title, "Đến nơi");
    assert.equal(
      GUEST_ARRIVAL,
      "Hướng dẫn vào khu và nhận villa sẽ do chủ nhà hoặc quản gia gửi cho bạn trước ngày đến.",
    );
    assert.equal(DESTINATION_COPY.arrival.body, GUEST_ARRIVAL);
  });

  it("labels the place Oceanami · Phước Hải", () => {
    assert.equal(LOCATION_LABEL, "Oceanami · Phước Hải");
  });

  it("does not claim beach club, bar, shuttle, cart, reception, 5-star, luxury, ratings, or province", () => {
    for (const text of marketingCopy()) {
      assert.equal(FORBIDDEN.test(text), false, text);
    }
  });
});

describe("amenities config", () => {
  it("keeps hours optional and never invents them", () => {
    const landscape = AMENITIES.find((item) => item.name.startsWith("Cảnh quan"));
    const bikes = AMENITIES.find((item) => item.name.startsWith("Cho thuê xe đạp"));
    assert.equal(landscape?.hours, undefined);
    assert.equal(bikes?.hours, undefined);
    assert.deepEqual(
      AMENITIES.find((item) => item.name === "Nhà hàng Maison")?.hours,
      ["6:30–10:00", "11:30–14:30", "17:30–21:30"],
    );
  });

  it("splits free common amenities from paid services", () => {
    assert.equal(AMENITIES_FREE.every((item) => item.free), true);
    assert.equal(AMENITIES_PAID.every((item) => !item.free), true);
    assert.ok(AMENITIES_FREE.some((item) => item.name.includes("Bãi biển riêng")));
    assert.ok(AMENITIES_PAID.some((item) => item.name === "Nhà hàng Maison"));
    assert.ok(AMENITIES_PAID.some((item) => item.name === "Lụa Spa"));
  });

  it("hero slider only shows free common amenities", () => {
    const joined = HERO_SLIDES.map((slide) => slide.caption).join(" ");
    assert.equal(/Maison|Lụa Spa|Jumping|xe đạp/i.test(joined), false);
    assert.equal(HERO_SLIDES.length, 5);
    assert.equal(HERO_SLIDES[0]?.caption, "Oceanami · Phước Hải");
  });
});

describe("image provenance", () => {
  it("uses the founder's real gym photos and keeps villa photos as illustrations", () => {
    const gymFiles = ["gym-01.jpg", "gym-02.jpg", "gym-03.jpg", "gym-04.jpg"];
    assert.deepEqual(
      GYM_PHOTOS.map((photo) => photo.file),
      gymFiles,
    );
    for (const file of gymFiles) {
      const photo = PHOTO_CATALOG.find(
        (item) => item.folder === "destination" && item.file === file,
      );
      assert.equal(photo?.type, "real", file);
      assert.equal(photo?.sourceUrl, undefined, file);
    }
    assert.equal(
      PHOTO_CATALOG.some((item) => item.file === "gym.jpg"),
      false,
    );
    const card = AMENITY_CARDS.find((item) => item.name === "Phòng tập");
    assert.deepEqual(
      card?.photos?.map((photo) => photo.file),
      gymFiles,
    );
    assert.equal(
      HERO_SLIDES.find((slide) => slide.caption.startsWith("Phòng tập"))?.file,
      "gym-04.jpg",
    );
    for (const villa of villas) {
      assert.ok(villa.images.length >= 1, villa.id);
      assert.equal(villa.images[0]?.illustration, true);
    }
  });

  it("does not use destination photos as villa photos", () => {
    for (const villa of villas) {
      for (const image of villa.images) {
        assert.equal(image.src.startsWith(`/photos/${villa.id}/`), true, image.src);
      }
    }
  });
});
