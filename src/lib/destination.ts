/** Canonical destination copy. Do not invent amenities beyond these blocks. */

export const LOCATION_LABEL = "Oceanami · Phước Hải";

export const GUEST_ARRIVAL =
  "Hướng dẫn vào khu và nhận villa sẽ do chủ nhà hoặc quản gia gửi cho bạn trước ngày đến.";

export const DESTINATION_COPY = {
  namePlace: {
    title: "Oceanami, Phước Hải",
    body: "Oceanami nằm tại thị trấn Phước Hải, huyện Đất Đỏ, tỉnh Bà Rịa – Vũng Tàu. Khu villas hướng ra biển Phước Hải và tựa lưng vào núi Minh Đạm, giữa vườn nhiệt đới và rừng cây. Mỗi độ xuân về, hoa anh đào nở trên khuôn viên.",
  },
  about: {
    title: "Về điểm đến",
    body: "Từ một vùng đất hoang sơ rộng khoảng 22 hecta, Oceanami được đưa vào hoạt động năm 2017. Logo lấy hình núi, biển và hoa anh đào. Villa do chủ nhà sở hữu và cho thuê. Stayora vận hành đặt phòng và thanh toán.",
  },
  amenities: {
    title: "Tiện ích chung",
    items: [
      "Bãi biển Phước Hải",
      "Hồ bơi chung",
      "Công viên và vườn cây",
      "Núi Minh Đạm",
      "Hoa anh đào vào mùa xuân",
    ],
  },
  around: {
    title: "Quanh khu nghỉ dưỡng",
    body: "Núi Minh Đạm ngay sau khu, khoảng mười phút. Gần đó có Dinh Cô, Thiền viện Trúc Lâm Chân Nguyên (khoảng 2 km) và Chùa Niết Bàn. Khu bảo tồn thiên nhiên Bình Châu – Phước Bửu nằm dọc đường ven biển.",
  },
  arrival: {
    title: "Đến nơi",
    body: "Quốc lộ 44A, thị trấn Phước Hải, huyện Đất Đỏ, tỉnh Bà Rịa – Vũng Tàu. Khoảng hai giờ lái xe từ Thành phố Hồ Chí Minh.",
  },
} as const;

export const DESTINATION = {
  name: "Oceanami",
  region: "Phước Hải, Bà Rịa–Vũng Tàu",
  country: "Việt Nam",
  address: "Quốc lộ 44A, thị trấn Phước Hải, huyện Đất Đỏ, tỉnh Bà Rịa – Vũng Tàu",
  locationLabel: LOCATION_LABEL,
  intro: DESTINATION_COPY.namePlace.body,
  travel: DESTINATION_COPY.arrival.body,
};

export type DestinationPhoto = {
  file: string;
  src: string;
  alt: string;
};

export const DESTINATION_PHOTOS: DestinationPhoto[] = [
  {
    file: "beach.jpg",
    src: "/photos/destination/beach.jpg",
    alt: "Bãi biển Phước Hải nhìn từ Oceanami",
  },
  {
    file: "aerial.jpg",
    src: "/photos/destination/aerial.jpg",
    alt: "Toàn cảnh Oceanami nhìn từ trên cao, biển và núi Minh Đạm",
  },
  {
    file: "pool.jpg",
    src: "/photos/destination/pool.jpg",
    alt: "Hồ bơi chung tại Oceanami",
  },
  {
    file: "landscape.jpg",
    src: "/photos/destination/landscape.jpg",
    alt: "Cảnh quan vườn và núi Minh Đạm tại Oceanami",
  },
  {
    file: "hoa-anh-dao.jpg",
    src: "/photos/destination/hoa-anh-dao.jpg",
    alt: "Hàng cây hoa anh đào trong khuôn viên Oceanami",
  },
  {
    file: "minh-dam.jpg",
    src: "/photos/destination/minh-dam.jpg",
    alt: "Núi Minh Đạm phía sau Oceanami",
  },
];

export const HERO_PHOTO = DESTINATION_PHOTOS[0];
export const AERIAL_PHOTO = DESTINATION_PHOTOS[1];
export const POOL_PHOTO = DESTINATION_PHOTOS[2];
export const LANDSCAPE_PHOTO = DESTINATION_PHOTOS[3];
export const BLOSSOM_PHOTO = DESTINATION_PHOTOS[4];
export const MOUNTAIN_PHOTO = DESTINATION_PHOTOS[5];

const VILLA_PHOTO_FILES: Record<string, string[]> = {
  "sao-bien": [],
  "huong-tram": [],
  "minh-dam": [],
  "sen-hong": [],
  "gio-bien": [],
  "cat-vang": [],
};

export function photosForVilla(villaId: string): { src: string; alt: string }[] {
  return (VILLA_PHOTO_FILES[villaId] ?? []).map((file) => ({
    src: `/photos/${villaId}/${file}`,
    alt: `Ảnh ${villaId}`,
  }));
}
