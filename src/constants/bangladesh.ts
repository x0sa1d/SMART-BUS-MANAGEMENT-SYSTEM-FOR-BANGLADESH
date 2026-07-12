export type DivisionData = {
  code: string;
  name: string;
  nameBn: string;
  districts: DistrictData[];
};

export type DistrictData = {
  code: string;
  name: string;
  nameBn: string;
  latitude: number;
  longitude: number;
  isHub?: boolean;
};

export const BANGLADESH_DIVISIONS: DivisionData[] = [
  {
    code: "BARISHAL",
    name: "Barishal",
    nameBn: "বরিশাল",
    districts: [
      { code: "BARGUNA", name: "Barguna", nameBn: "বরগুনা", latitude: 22.0953, longitude: 90.1121 },
      { code: "BARISHAL", name: "Barishal", nameBn: "বরিশাল", latitude: 22.701, longitude: 90.3535, isHub: true },
      { code: "BHOLA", name: "Bhola", nameBn: "ভোলা", latitude: 22.6859, longitude: 90.6482 },
      { code: "JHALOKATI", name: "Jhalokati", nameBn: "ঝালকাঠি", latitude: 22.6416, longitude: 90.1987 },
      { code: "PATUAKHALI", name: "Patuakhali", nameBn: "পটুয়াখালী", latitude: 22.3596, longitude: 90.3298 },
      { code: "PIROJPUR", name: "Pirojpur", nameBn: "পিরোজপুর", latitude: 22.5791, longitude: 89.9759 },
    ],
  },
  {
    code: "CHATTOGRAM",
    name: "Chattogram",
    nameBn: "চট্টগ্রাম",
    districts: [
      { code: "BANDARBAN", name: "Bandarban", nameBn: "বান্দরবান", latitude: 22.1953, longitude: 92.2184 },
      { code: "BRAHMANBARIA", name: "Brahmanbaria", nameBn: "ব্রাহ্মণবাড়িয়া", latitude: 23.9579, longitude: 91.1115 },
      { code: "CHANDPUR", name: "Chandpur", nameBn: "চাঁদপুর", latitude: 23.2333, longitude: 90.671 },
      { code: "CHATTOGRAM", name: "Chattogram", nameBn: "চট্টগ্রাম", latitude: 22.3569, longitude: 91.7832, isHub: true },
      { code: "CUMILLA", name: "Cumilla", nameBn: "কুমিল্লা", latitude: 23.4607, longitude: 91.1809 },
      { code: "COXS_BAZAR", name: "Cox's Bazar", nameBn: "কক্সবাজার", latitude: 21.4272, longitude: 92.0058 },
      { code: "FENI", name: "Feni", nameBn: "ফেনী", latitude: 23.0152, longitude: 91.3966 },
      { code: "KHAGRACHHARI", name: "Khagrachhari", nameBn: "খাগড়াছড়ি", latitude: 23.1193, longitude: 91.9847 },
      { code: "LAKSHMIPUR", name: "Lakshmipur", nameBn: "লক্ষ্মীপুর", latitude: 22.9443, longitude: 90.8282 },
      { code: "NOAKHALI", name: "Noakhali", nameBn: "নোয়াখালী", latitude: 22.8696, longitude: 91.0995 },
      { code: "RANGAMATI", name: "Rangamati", nameBn: "রাঙ্গামাটি", latitude: 22.6533, longitude: 92.178 },
    ],
  },
  {
    code: "DHAKA",
    name: "Dhaka",
    nameBn: "ঢাকা",
    districts: [
      { code: "DHAKA", name: "Dhaka", nameBn: "ঢাকা", latitude: 23.8103, longitude: 90.4125, isHub: true },
      { code: "FARIDPUR", name: "Faridpur", nameBn: "ফরিদপুর", latitude: 23.6061, longitude: 89.8406 },
      { code: "GAZIPUR", name: "Gazipur", nameBn: "গাজীপুর", latitude: 23.9999, longitude: 90.4203 },
      { code: "GOPALGANJ", name: "Gopalganj", nameBn: "গopalganj", latitude: 23.0051, longitude: 89.8266 },
      { code: "KISHOREGANJ", name: "Kishoreganj", nameBn: "কিশোরগঞ্জ", latitude: 24.4449, longitude: 90.7766 },
      { code: "MADARIPUR", name: "Madaripur", nameBn: "মাদারীপুর", latitude: 23.1641, longitude: 90.189 },
      { code: "MANIKGANJ", name: "Manikganj", nameBn: "মানিকগঞ্জ", latitude: 23.8644, longitude: 90.0047 },
      { code: "MUNSHIGANJ", name: "Munshiganj", nameBn: "মুন্সীগঞ্জ", latitude: 23.5422, longitude: 90.5305 },
      { code: "NARAYANGANJ", name: "Narayanganj", nameBn: "নারায়ণগঞ্জ", latitude: 23.6238, longitude: 90.499 },
      { code: "NARSINGDI", name: "Narsingdi", nameBn: "নরসিংদী", latitude: 23.9322, longitude: 90.7151 },
      { code: "RAJBARI", name: "Rajbari", nameBn: "রাজবাড়ী", latitude: 23.7574, longitude: 89.6445 },
      { code: "SHARIATPUR", name: "Shariatpur", nameBn: "শরীয়তপুর", latitude: 23.2423, longitude: 90.4348 },
      { code: "TANGAIL", name: "Tangail", nameBn: "টাঙ্গাইল", latitude: 24.2513, longitude: 89.9167 },
    ],
  },
  {
    code: "KHULNA",
    name: "Khulna",
    nameBn: "খুলনা",
    districts: [
      { code: "BAGERHAT", name: "Bagerhat", nameBn: "বাগেরহাট", latitude: 22.6516, longitude: 89.7859 },
      { code: "CHUADANGA", name: "Chuadanga", nameBn: "চুয়াডাঙ্গা", latitude: 23.6402, longitude: 88.8418 },
      { code: "JASHORE", name: "Jashore", nameBn: "যশোর", latitude: 23.1665, longitude: 89.2089 },
      { code: "JHENAIDAH", name: "Jhenaidah", nameBn: "ঝিনাইদহ", latitude: 23.5448, longitude: 89.153 },
      { code: "KHULNA", name: "Khulna", nameBn: "খুলনা", latitude: 22.8456, longitude: 89.5403, isHub: true },
      { code: "KUSHTIA", name: "Kushtia", nameBn: "কুষ্টিয়া", latitude: 23.9018, longitude: 89.1208 },
      { code: "MAGURA", name: "Magura", nameBn: "মাগুরা", latitude: 23.4873, longitude: 89.4196 },
      { code: "MEHERPUR", name: "Meherpur", nameBn: "মেহেরপুর", latitude: 23.7622, longitude: 88.6318 },
      { code: "NARAIL", name: "Narail", nameBn: "নড়াইল", latitude: 23.1725, longitude: 89.5126 },
      { code: "SATKHIRA", name: "Satkhira", nameBn: "সাতক্ষীরা", latitude: 22.7185, longitude: 89.0705 },
    ],
  },
  {
    code: "MYMENSINGH",
    name: "Mymensingh",
    nameBn: "ময়মনসিংহ",
    districts: [
      { code: "JAMALPUR", name: "Jamalpur", nameBn: "জামালপুর", latitude: 24.9375, longitude: 89.9372 },
      { code: "MYMENSINGH", name: "Mymensingh", nameBn: "ময়মনসিংহ", latitude: 24.7471, longitude: 90.4203, isHub: true },
      { code: "NETROKONA", name: "Netrokona", nameBn: "নেত্রকোনা", latitude: 24.8709, longitude: 90.7279 },
      { code: "SHERPUR", name: "Sherpur", nameBn: "শেরপুর", latitude: 25.0205, longitude: 90.0156 },
    ],
  },
  {
    code: "RAJSHAHI",
    name: "Rajshahi",
    nameBn: "রাজশাহী",
    districts: [
      { code: "BOGURA", name: "Bogura", nameBn: "বগুড়া", latitude: 24.8465, longitude: 89.3778 },
      { code: "JOYPURHAT", name: "Joypurhat", nameBn: "জয়পুরহাট", latitude: 25.1018, longitude: 89.0273 },
      { code: "NAOGAON", name: "Naogaon", nameBn: "নওগাঁ", latitude: 24.8138, longitude: 88.9453 },
      { code: "NATORE", name: "Natore", nameBn: "নাটোর", latitude: 24.4206, longitude: 89.0006 },
      { code: "CHAPAINAWABGANJ", name: "Chapainawabganj", nameBn: "চাঁপাইনবাবগঞ্জ", latitude: 24.5965, longitude: 88.2775 },
      { code: "PABNA", name: "Pabna", nameBn: "পাবনা", latitude: 24.0064, longitude: 89.2372 },
      { code: "RAJSHAHI", name: "Rajshahi", nameBn: "রাজশাহী", latitude: 24.3745, longitude: 88.6042, isHub: true },
      { code: "SIRAJGANJ", name: "Sirajganj", nameBn: "সিরাজগঞ্জ", latitude: 24.4534, longitude: 89.7006 },
    ],
  },
  {
    code: "RANGPUR",
    name: "Rangpur",
    nameBn: "রংপুর",
    districts: [
      { code: "DINAJPUR", name: "Dinajpur", nameBn: "দিনাজপুর", latitude: 25.6279, longitude: 88.6332 },
      { code: "GAIBANDHA", name: "Gaibandha", nameBn: "গাইবান্ধা", latitude: 25.3288, longitude: 89.5281 },
      { code: "KURIGRAM", name: "Kurigram", nameBn: "কুড়িগ্রাম", latitude: 25.8054, longitude: 89.6362 },
      { code: "LALMONIRHAT", name: "Lalmonirhat", nameBn: "লalmonirhat", latitude: 25.9923, longitude: 89.2847 },
      { code: "NILPHAMARI", name: "Nilphamari", nameBn: "নীলফামারী", latitude: 25.9316, longitude: 88.856 },
      { code: "PANCHAGARH", name: "Panchagarh", nameBn: "পঞ্চগড়", latitude: 26.3411, longitude: 88.5542 },
      { code: "RANGPUR", name: "Rangpur", nameBn: "রংপুর", latitude: 25.7439, longitude: 89.2752, isHub: true },
      { code: "THAKURGAON", name: "Thakurgaon", nameBn: "ঠাকুরগাঁও", latitude: 26.025, longitude: 88.4945 },
    ],
  },
  {
    code: "SYLHET",
    name: "Sylhet",
    nameBn: "সylhet",
    districts: [
      { code: "HABIGANJ", name: "Habiganj", nameBn: "হবিগঞ্জ", latitude: 24.3749, longitude: 91.4155 },
      { code: "MOULVIBAZAR", name: "Moulvibazar", nameBn: "মৌলভীবাজার", latitude: 24.4829, longitude: 91.7774 },
      { code: "SUNAMGANJ", name: "Sunamganj", nameBn: "সুনামগঞ্জ", latitude: 25.0658, longitude: 91.3958 },
      { code: "SYLHET", name: "Sylhet", nameBn: "সিলেট", latitude: 24.8949, longitude: 91.8687, isHub: true },
    ],
  },
];

export const ALL_DISTRICTS = BANGLADESH_DIVISIONS.flatMap((d) =>
  d.districts.map((dist) => ({ ...dist, divisionCode: d.code, divisionName: d.name }))
);

export const DISTRICT_COUNT = ALL_DISTRICTS.length;

export function getDistrictByName(name: string) {
  return ALL_DISTRICTS.find(
    (d) => d.name.toLowerCase() === name.toLowerCase() || d.code.toLowerCase() === name.toLowerCase()
  );
}
