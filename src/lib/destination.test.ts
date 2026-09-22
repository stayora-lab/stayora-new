import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DESTINATION_COPY,
  DESTINATION_PHOTOS,
  GUEST_ARRIVAL,
  LOCATION_LABEL,
} from "./destination.ts";
import sources from "../../public/photos/destination/SOURCES.json" with { type: "json" };

const FORBIDDEN =
  /nhà hàng|\bspa\b|beach club|quán bar|shuttle|xe đưa đón|xe điện|lễ tân|sảnh lễ|5\s*sao|sang trọng|đánh giá/i;

function allCopy(): string[] {
  return [
    DESTINATION_COPY.namePlace.title,
    DESTINATION_COPY.namePlace.body,
    DESTINATION_COPY.about.title,
    DESTINATION_COPY.about.body,
    DESTINATION_COPY.amenities.title,
    ...DESTINATION_COPY.amenities.items,
    DESTINATION_COPY.around.title,
    DESTINATION_COPY.around.body,
    DESTINATION_COPY.arrival.title,
    DESTINATION_COPY.arrival.body,
    GUEST_ARRIVAL,
    LOCATION_LABEL,
    ...DESTINATION_PHOTOS.map((photo) => photo.alt),
  ];
}

describe("destination copy", () => {
  it("keeps the five block titles", () => {
    assert.equal(DESTINATION_COPY.namePlace.title, "Oceanami, Phước Hải");
    assert.equal(DESTINATION_COPY.about.title, "Về điểm đến");
    assert.equal(DESTINATION_COPY.amenities.title, "Tiện ích chung");
    assert.equal(DESTINATION_COPY.around.title, "Quanh khu nghỉ dưỡng");
    assert.equal(DESTINATION_COPY.arrival.title, "Đến nơi");
  });

  it("uses the founder arrival sentence", () => {
    assert.equal(
      GUEST_ARRIVAL,
      "Hướng dẫn vào khu và nhận villa sẽ do chủ nhà hoặc quản gia gửi cho bạn trước ngày đến.",
    );
  });

  it("labels the place Oceanami · Phước Hải", () => {
    assert.equal(LOCATION_LABEL, "Oceanami · Phước Hải");
  });

  it("does not claim restaurants, spa, beach club, bar, shuttle, cart, reception, 5-star, luxury, or ratings", () => {
    for (const text of allCopy()) {
      assert.equal(FORBIDDEN.test(text), false, text);
    }
  });

  it("lists the same destination files as SOURCES.json", () => {
    const fromCopy = DESTINATION_PHOTOS.map((photo) => photo.file).sort();
    const fromSources = (sources as { file: string }[]).map((row) => row.file).sort();
    assert.deepEqual(fromCopy, fromSources);
  });
});
