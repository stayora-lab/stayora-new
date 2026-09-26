/** Canonical Oceanami copy and amenity hours. UI reads only from this file. */

export const LOCATION_LABEL = "Oceanami · Phước Hải";

export const HERO_TITLE = "Oceanami, Phước Hải";
export const HERO_SUBTITLE =
  "Biển Phước Hải phía trước, núi Minh Đạm phía sau. Đặt villa trực tiếp với các chủ nhà tại Oceanami qua Stayora.";

export const ABOUT_TITLE = "Về điểm đến";
export const ABOUT_BODY =
  "Oceanami là khu nghỉ dưỡng rộng hơn 22 hecta trên bờ biển Phước Hải, gần Long Hải, cách TP.HCM khoảng 2–3 giờ đi xe tuỳ giao thông. Mở cửa từ năm 2017, khu có 351 villa, quay mặt ra biển và tựa lưng vào dãy Minh Đạm. Mỗi mùa xuân, hàng cây hoa trong khu nhuộm hồng cả sườn đồi.";

export const AROUND_TITLE = "Quanh khu nghỉ dưỡng";
export const AROUND_BODY =
  "Làng chài Phước Hải, Dinh Cô Long Hải, núi Minh Đạm, chợ Long Hải và các quán cà phê ven biển đều chỉ cách vài phút.";

export const ARRIVAL_TITLE = "Đến nơi";
export const ARRIVAL_BODY =
  "Hướng dẫn vào khu và nhận villa sẽ do chủ nhà hoặc quản gia gửi cho bạn trước ngày đến.";

export const GUEST_ARRIVAL = ARRIVAL_BODY;

export const AMENITIES_FREE_TITLE = "Tiện ích chung — miễn phí cho khách lưu trú";
export const AMENITIES_FREE_INTRO =
  "Các chủ villa cùng đóng phí quản lý hằng tháng để duy trì tiện ích chung, nên khách ở mọi villa đều được sử dụng miễn phí trong giờ quy định.";
export const AMENITIES_PAID_TITLE = "Dịch vụ trong khu — tính phí";
export const AMENITIES_FOOTNOTE =
  "Giờ hoạt động có thể thay đổi theo quy định của khu nghỉ dưỡng.";
export const VILLA_COMMON_AMENITIES_LINE =
  "Khách được sử dụng miễn phí tiện ích chung của khu nghỉ dưỡng";
export const AMENITIES_SECTION_ID = "tien-ich";

export type Amenity = {
  name: string;
  hours?: string[];
  free: boolean;
};

export const AMENITIES: Amenity[] = [
  { name: "Bãi biển riêng (khoảng 700 m)", hours: ["6:00–18:00"], free: true },
  { name: "Hồ bơi chung", hours: ["6:00–18:00"], free: true },
  { name: "Phòng tập", hours: ["8:00–18:00"], free: true },
  { name: "Cảnh quan, đường dạo và bãi đỗ xe", free: true },
  { name: "Nhà hàng Maison", hours: ["6:30–10:00", "11:30–14:30", "17:30–21:30"], free: false },
  { name: "Lụa Spa", hours: ["8:00–20:00"], free: false },
  { name: "Khu bạt nhún trẻ em Jumping Galaxy", hours: ["8:00–17:00"], free: false },
  { name: "Cho thuê xe đạp đi trong khu", free: false },
];

export const AMENITIES_FREE = AMENITIES.filter((item) => item.free);
export const AMENITIES_PAID = AMENITIES.filter((item) => !item.free);

export type AmenityPhoto = {
  file: string;
  src: string;
  alt: string;
};

/** Founder-supplied stills of the Oceanami gym. Not illustrations. */
export const GYM_PHOTOS: AmenityPhoto[] = [
  {
    file: "gym-01.jpg",
    src: "/photos/destination/gym-01.jpg",
    alt: "Lối vào phòng tập Oceanami, nhìn vào khu máy",
  },
  {
    file: "gym-02.jpg",
    src: "/photos/destination/gym-02.jpg",
    alt: "Khu máy tập đa năng cạnh cửa kính nhìn ra vườn",
  },
  {
    file: "gym-03.jpg",
    src: "/photos/destination/gym-03.jpg",
    alt: "Máy tập cạnh cửa kính và hàng dừa",
  },
  {
    file: "gym-04.jpg",
    src: "/photos/destination/gym-04.jpg",
    alt: "Khu cardio phòng tập với máy chạy bộ và xe đạp, nhìn ra vườn dừa",
  },
];

/** Founder-supplied stills of Maison. Not illustrations. Paid, so not a hero slide. */
export const MAISON_PHOTOS: AmenityPhoto[] = [
  {
    file: "maison-01.jpg",
    src: "/photos/destination/maison-01.jpg",
    alt: "Sân ngoài nhà hàng Maison, ô dù trắng và vàng",
  },
  {
    file: "maison-02.jpg",
    src: "/photos/destination/maison-02.jpg",
    alt: "Phòng ăn Maison, bàn gỗ và ghế xanh nhìn ra biển",
  },
  {
    file: "maison-03.jpg",
    src: "/photos/destination/maison-03.jpg",
    alt: "Phòng ăn Maison nhìn rộng, cửa kính và hàng dừa",
  },
  {
    file: "maison-04.jpg",
    src: "/photos/destination/maison-04.jpg",
    alt: "Quầy buffet nhà hàng Maison",
  },
  {
    file: "maison-05.jpg",
    src: "/photos/destination/maison-05.jpg",
    alt: "Nhà hàng Maison nhìn từ ngoài vào ban đêm",
  },
];

export type HeroSlide = {
  file: string;
  src: string;
  alt: string;
  caption: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    file: "aerial.jpg",
    src: "/photos/destination/aerial.jpg",
    alt: "Toàn cảnh biển Phước Hải và núi Minh Đạm nhìn từ trên cao",
    caption: "Oceanami · Phước Hải",
  },
  {
    file: "beach.jpg",
    src: "/photos/destination/beach.jpg",
    alt: "Bãi biển riêng tại Oceanami, Phước Hải",
    caption: "Bãi biển riêng · khoảng 700 m · 6:00–18:00",
  },
  {
    file: "pool.jpg",
    src: "/photos/destination/pool.jpg",
    alt: "Hồ bơi chung của khu nghỉ dưỡng",
    caption: "Hồ bơi chung · 6:00–18:00",
  },
  {
    file: "hoa-anh-dao.jpg",
    src: "/photos/destination/hoa-anh-dao.jpg",
    alt: "Cảnh quan và hàng cây hoa trong khu nghỉ dưỡng",
    caption: "Cảnh quan và mùa hoa trong khu",
  },
  {
    file: "gym-04.jpg",
    src: "/photos/destination/gym-04.jpg",
    alt: "Khu cardio phòng tập với máy chạy bộ và xe đạp, nhìn ra vườn dừa",
    caption: "Phòng tập · 8:00–18:00",
  },
];

export type AmenityCard = Amenity & AmenityPhoto & {
  photos?: AmenityPhoto[];
};

export const AMENITY_CARDS: AmenityCard[] = [
  {
    ...AMENITIES[0],
    file: "beach.jpg",
    src: "/photos/destination/beach.jpg",
    alt: "Bãi biển riêng tại Oceanami, Phước Hải",
  },
  {
    ...AMENITIES[1],
    file: "pool.jpg",
    src: "/photos/destination/pool.jpg",
    alt: "Hồ bơi chung của khu nghỉ dưỡng",
  },
  {
    ...AMENITIES[2],
    ...GYM_PHOTOS[0],
    photos: GYM_PHOTOS,
  },
  {
    ...AMENITIES[3],
    file: "landscape.jpg",
    src: "/photos/destination/landscape.jpg",
    alt: "Cảnh quan, đường dạo trong khu nghỉ dưỡng",
  },
  {
    ...AMENITIES[4],
    ...MAISON_PHOTOS[0],
    photos: MAISON_PHOTOS,
  },
  {
    ...AMENITIES[5],
    file: "lua-spa.jpg",
    src: "/photos/destination/lua-spa.jpg",
    alt: "Lụa Spa",
  },
  {
    ...AMENITIES[6],
    file: "jumping-galaxy.jpg",
    src: "/photos/destination/jumping-galaxy.jpg",
    alt: "Khu bạt nhún trẻ em Jumping Galaxy",
  },
  {
    ...AMENITIES[7],
    file: "bicycle.jpg",
    src: "/photos/destination/bicycle.jpg",
    alt: "Xe đạp cho thuê trong khu",
  },
];

export function formatAmenityHours(hours: string[] | undefined): string | null {
  if (!hours || hours.length === 0) return null;
  return hours.join(" · ");
}
