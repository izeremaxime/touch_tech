-- Run against an existing PostgreSQL database (cloud hosts like Supabase/Neon
-- already create one per project — connect to it and run this directly).

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  rating INT NOT NULL DEFAULT 5,
  review_count INT NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  image VARCHAR(255) DEFAULT NULL,
  specs TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uniq_session_product UNIQUE (session_id, product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value VARCHAR(255) NOT NULL
);

INSERT INTO settings (key, value) VALUES
('tax_rate', '0.08'),
('free_shipping_threshold', '150'),
('shipping_fee', '15'),
('low_stock_threshold', '10')
ON CONFLICT (key) DO NOTHING;

INSERT INTO products (id, name, sku, category, price, sale_price, stock, rating, review_count, description, image, specs) VALUES
(1, 'Titan Pro MagSafe Case', 'TA-TPM-15P', 'cases', 75.00, NULL, 45, 5, 128, 'Military-grade drop protection meets seamless MagSafe compatibility. The Titan Pro Case features shock-absorbing TPU corners, a scratch-resistant polycarbonate backplate, and an integrated N52 neodymium magnet ring for maximum wireless charging efficiency.', '/assets/images/product-case.svg', '{"Material":"Polycarbonate & TPU","Compatibility":"iPhone 15 Pro / 15 Pro Max","Drop Protection":"Up to 13 feet (4m)","Wireless Charging":"MagSafe & Qi Compatible","Weight":"42 grams"}'),
(2, 'MagSafe Duo Charger', 'TA-MSD-CHG', 'chargers', 75.00, NULL, 3, 4, 84, 'Power your devices in absolute style. The MagSafe Duo Charger provides rapid dual-device wireless charging for your phone and earbuds simultaneously. Features intelligent temperature control and a premium sleek metallic base.', '/assets/images/product-charger.svg', '{"Input":"9V/3A USB-C PD","Output":"15W Max (Phone) / 5W Max (Pods)","Ports":"1x USB-C Port","Material":"Anodized Aluminum & Silicone","Dimensions":"160mm x 80mm x 10mm"}'),
(3, 'LensGuard Pro Film', 'TA-LGP-FLM', 'screen-protectors', 35.00, 28.00, 120, 4, 64, 'Ultra-clear screen protection without sacrificing sensitivity. Crafted from double-strengthened aluminosilicate glass, the LensGuard Pro offers flawless edge-to-edge defense against scratches, smudges, and impact.', '/assets/images/product-screen.svg', '{"Hardness":"9H Mohs Scale","Thickness":"0.33mm","Clarity":"99.9% Light Transmittance","Coating":"Oleophobic Anti-Fingerprint","Material":"Tempered Glass"}'),
(4, 'Carbon Shield Air', 'TA-CSA-15P', 'cases', 60.00, NULL, 0, 5, 92, 'Premium aramid carbon fiber case designed for minimalists. The Carbon Shield Air offers featherweight protection with a textured, tactile grip. Laser-cut precision ensures easy access to all buttons and ports.', '/assets/images/product-carbon-case.svg', '{"Material":"600D Aramid Carbon Fiber","Thickness":"0.6mm","Weight":"12 grams","Finish":"Matte Textured Grip","MagSafe":"Thin magnetic sheet embedded"}'),
(5, '20W Fast Wall Adapter', 'TA-20W-PD', 'chargers', 25.00, NULL, 15, 4, 47, 'Compact and energy-efficient rapid wall plug. Powered by GaN technology, this ultra-small adapter delivers a full 20W power delivery output, charging your smartphone to 50% in under 30 minutes.', '/assets/images/product-wall-adapter.svg', '{"Input":"100-240V ~ 50/60Hz","Output":"USB-C PD 5V/3A, 9V/2.22A","Tech":"Gallium Nitride (GaN)","Certification":"UL, FCC, CE Certified","Protection":"Over-current, Over-voltage"}'),
(6, 'Privacy Glass Elite', 'TA-PGE-GLS', 'screen-protectors', 42.00, NULL, 8, 5, 105, 'Keep your private data secure from prying eyes. The Privacy Glass Elite restricts the viewing angle to 28 degrees in portrait mode, while maintaining perfect front-facing clarity and high responsiveness.', '/assets/images/product-privacy-glass.svg', '{"Viewing Angle":"28° Side Privacy","Hardness":"9H Tempered Glass","Thickness":"0.38mm","Filter":"Polarizing Micro-louver","Application":"Easy-align Frame Included"}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Keep the SERIAL sequence ahead of the explicit ids inserted above.
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));

INSERT INTO products (name, sku, category, price, sale_price, stock, rating, review_count, description, image, specs) VALUES

-- Phone Cases
('Samsung Galaxy S24 Clear Shield', 'SG-CLS-S24', 'cases', 22.00, NULL, 60, 4, 51, 'Show off your Galaxy S24 in a case built for it. Crystal-clear polycarbonate resists yellowing over time while raised bezels keep the screen and camera protected from scratches.', '/assets/images/product-case.svg', '{"Material":"Polycarbonate & TPU","Compatibility":"Samsung Galaxy S24","Drop Protection":"Up to 6 feet","Weight":"32 grams"}'),
('Pixel 8 Rugged Armor Case', 'GP-RAC-P8', 'cases', 28.00, 22.00, 34, 5, 73, 'Dual-layer rugged protection for the Pixel 8. Shock-absorbing corners and a textured grip keep your phone secure through daily drops and bumps.', '/assets/images/product-carbon-case.svg', '{"Material":"TPU & Polycarbonate","Compatibility":"Google Pixel 8","Drop Protection":"Up to 10 feet","Weight":"48 grams"}'),
('iPhone 15 Silicone Case', 'AP-SIL-15', 'cases', 45.00, NULL, 50, 4, 118, 'Soft-touch silicone exterior with a microfiber lining that protects your iPhone 15 without adding bulk. Available with full button and port access.', '/assets/images/product-case.svg', '{"Material":"Liquid Silicone","Compatibility":"iPhone 15","MagSafe":"Compatible","Weight":"38 grams"}'),

-- Chargers
('Apple 20W USB-C Power Adapter', 'AP-20W-USC', 'chargers', 19.00, NULL, 90, 5, 210, 'Apple''s compact 20W USB-C adapter delivers fast, efficient charging for iPhone, iPad, and AirPods. Pairs with any USB-C cable.', '/assets/images/product-wall-adapter.svg', '{"Output":"USB-C PD 20W","Input":"100-240V ~ 50/60Hz","Certification":"MFi Certified","Weight":"33 grams"}'),
('Samsung 25W Super Fast Charger', 'SG-25W-SFC', 'chargers', 24.00, NULL, 40, 4, 88, 'Get your Galaxy device from 0 to 50% in about 30 minutes. Samsung''s 25W Super Fast Charging adapter with USB-C PD/PPS support.', '/assets/images/product-wall-adapter.svg', '{"Output":"USB-C PD/PPS 25W","Input":"100-240V ~ 50/60Hz","Compatibility":"Galaxy S & Note series","Weight":"36 grams"}'),
('LG Compact Travel Charger', 'LG-CTC-18W', 'chargers', 16.00, NULL, 25, 3, 19, 'A pocket-sized 18W USB-C wall charger built for travel. Foldable prongs and a durable matte finish make it an easy everyday-carry companion.', '/assets/images/product-charger.svg', '{"Output":"USB-C PD 18W","Input":"100-240V ~ 50/60Hz","Foldable Prongs":"Yes","Weight":"30 grams"}'),
('Anker Nano II 45W GaN Charger', 'AK-N2-45W', 'chargers', 32.00, 27.00, 55, 5, 142, 'Compact GaN II charging technology packs 45W of power into a charger smaller than a matchbox. Fast-charges laptops, tablets, and phones alike.', '/assets/images/product-wall-adapter.svg', '{"Output":"USB-C PD 45W","Tech":"GaN II","Input":"100-240V ~ 50/60Hz","Weight":"53 grams"}'),

-- Cables
('Apple USB-C to Lightning Cable 1m', 'AP-CTL-1M', 'cables', 19.00, NULL, 150, 5, 305, 'Official Apple USB-C to Lightning cable for fast charging and syncing with iPhone. Reinforced connectors built for daily use.', '/assets/images/product-cable.svg', '{"Length":"1 meter","Connector A":"USB-C","Connector B":"Lightning","Certification":"MFi Certified"}'),
('Braided USB-C to USB-C Cable 2m', 'TA-CTC-2M', 'cables', 14.00, NULL, 120, 4, 76, 'Nylon-braided USB-C to USB-C cable rated for 100W fast charging and 480Mbps data transfer. Built to resist fraying and tangles.', '/assets/images/product-cable.svg', '{"Length":"2 meters","Power Delivery":"Up to 100W","Data Speed":"480Mbps","Material":"Nylon Braided"}'),
('USB-C to HDMI Adapter Cable', 'TA-CHD-4K', 'cables', 22.00, NULL, 40, 4, 33, 'Mirror or extend your laptop or phone display to any HDMI monitor or TV in sharp 4K resolution.', '/assets/images/product-cable.svg', '{"Length":"1.8 meters","Output":"4K @ 30Hz","Connector A":"USB-C","Connector B":"HDMI"}'),
('Micro-USB Fast Charge Cable', 'TA-MUC-1M', 'cables', 9.00, NULL, 200, 3, 58, 'A reliable everyday Micro-USB cable for charging and data transfer on older Android devices, speakers, and accessories.', '/assets/images/product-cable.svg', '{"Length":"1 meter","Connector A":"USB-A","Connector B":"Micro-USB","Data Speed":"480Mbps"}'),

-- Screen Protectors
('Samsung Galaxy Tempered Glass Duo', 'SG-TGD-S24', 'screen-protectors', 18.00, NULL, 95, 4, 41, 'Two-pack of edge-to-edge tempered glass protectors for Galaxy S24, with an alignment tray for bubble-free installation.', '/assets/images/product-screen.svg', '{"Hardness":"9H","Thickness":"0.3mm","Pack Size":"2 protectors","Install Kit":"Included"}'),
('iPad Pro Screen Shield', 'AP-IPS-PRO', 'screen-protectors', 30.00, NULL, 22, 4, 27, 'Anti-glare tempered glass sized for iPad Pro, cutting reflections while staying compatible with Apple Pencil precision.', '/assets/images/product-privacy-glass.svg', '{"Hardness":"9H","Finish":"Anti-Glare Matte","Compatibility":"iPad Pro 11-inch","Apple Pencil":"Fully Compatible"}'),

-- Phones
('iPhone 15 Pro Max 256GB', 'AP-IP15-PM', 'phones', 1199.00, NULL, 12, 5, 342, 'Apple''s flagship with a titanium frame, A17 Pro chip, and a pro camera system with 5x telephoto zoom.', '/assets/images/product-phone.svg', '{"Display":"6.7\" Super Retina XDR","Chip":"A17 Pro","Storage":"256GB","Camera":"48MP Triple Camera","Battery":"Up to 29 hrs video"}'),
('Samsung Galaxy S24 Ultra 256GB', 'SG-S24-ULT', 'phones', 1099.00, 999.00, 9, 5, 287, 'A 200MP camera, built-in S Pen, and a bright titanium-framed display make the S24 Ultra Samsung''s most capable phone yet.', '/assets/images/product-phone.svg', '{"Display":"6.8\" Dynamic AMOLED 2X","Chip":"Snapdragon 8 Gen 3","Storage":"256GB","Camera":"200MP Quad Camera","S Pen":"Built-in"}'),
('Google Pixel 8 Pro 128GB', 'GP-PX8-PRO', 'phones', 899.00, NULL, 15, 4, 156, 'Pixel''s Tensor G3 chip powers best-in-class computational photography and 7 years of guaranteed OS updates.', '/assets/images/product-phone.svg', '{"Display":"6.7\" LTPO OLED","Chip":"Google Tensor G3","Storage":"128GB","Camera":"50MP Triple Camera","OS Updates":"7 years"}'),
('Xiaomi 14 512GB', 'XM-14-512', 'phones', 799.00, NULL, 0, 4, 64, 'A compact flagship co-engineered with Leica optics, wrapped in a premium ceramic-back design.', '/assets/images/product-phone.svg', '{"Display":"6.36\" LTPO AMOLED","Chip":"Snapdragon 8 Gen 3","Storage":"512GB","Camera":"50MP Leica Triple Camera","Battery":"4610mAh"}'),

-- Laptops
('MacBook Air 15" M3', 'AP-MBA-M3', 'laptops', 1499.00, NULL, 8, 5, 198, 'The 15-inch MacBook Air fits a bigger canvas into a design that''s still just 11.5mm thin, powered by the efficient M3 chip.', '/assets/images/product-laptop.svg', '{"Display":"15.3\" Liquid Retina","Chip":"Apple M3","RAM":"16GB","Storage":"512GB SSD","Battery Life":"Up to 18 hrs"}'),
('MacBook Pro 14" M3 Pro', 'AP-MBP-14', 'laptops', 1999.00, NULL, 5, 5, 121, 'Serious performance for serious workloads. The M3 Pro chip and mini-LED display make this the choice for creative professionals.', '/assets/images/product-laptop.svg', '{"Display":"14.2\" Liquid Retina XDR","Chip":"Apple M3 Pro","RAM":"18GB","Storage":"512GB SSD","Battery Life":"Up to 18 hrs"}'),
('Dell XPS 13 Plus', 'DL-XPS-13P', 'laptops', 1299.00, 1099.00, 11, 4, 87, 'An edge-to-edge keyboard and a seamless glass trackpad give the XPS 13 Plus a striking, minimal design without sacrificing power.', '/assets/images/product-laptop.svg', '{"Display":"13.4\" FHD+ InfinityEdge","Chip":"Intel Core i7-1360P","RAM":"16GB","Storage":"512GB SSD","Weight":"1.26 kg"}'),
('HP Spectre x360 14', 'HP-SPX-14', 'laptops', 1349.00, NULL, 7, 4, 65, 'A 2-in-1 convertible with a gem-cut design, OLED display option, and a 360-degree hinge for tablet, tent, or laptop modes.', '/assets/images/product-laptop.svg', '{"Display":"13.5\" 3K2K OLED","Chip":"Intel Core i7-1355U","RAM":"16GB","Storage":"1TB SSD","Convertible":"360-degree hinge"}'),
('Lenovo ThinkPad X1 Carbon Gen 12', 'LN-X1C-G12', 'laptops', 1599.00, NULL, 6, 5, 94, 'The business standard: a carbon-fiber chassis, legendary ThinkPad keyboard, and MIL-SPEC durability testing in a 1.12kg frame.', '/assets/images/product-laptop.svg', '{"Display":"14\" 2.8K OLED","Chip":"Intel Core Ultra 7","RAM":"32GB","Storage":"1TB SSD","Weight":"1.12 kg"}'),

-- Headsets
('Apple AirPods Pro (2nd Gen)', 'AP-APP-2', 'headsets', 249.00, NULL, 45, 5, 512, 'Adaptive Audio, up to 2x more Active Noise Cancellation, and a USB-C charging case make the second-generation AirPods Pro Apple''s best earbuds yet.', '/assets/images/product-headset.svg', '{"Noise Cancellation":"Active + Transparency","Battery Life":"Up to 6 hrs (ANC on)","Case":"USB-C MagSafe Charging","Water Resistance":"IP54"}'),
('Sony WH-1000XM5 Wireless', 'SN-XM5-BLK', 'headsets', 399.00, 349.00, 20, 5, 267, 'Industry-leading noise cancellation meets all-day comfort. Eight microphones and two processors deliver Sony''s best ANC yet.', '/assets/images/product-headset.svg', '{"Noise Cancellation":"Dual Processor ANC","Battery Life":"Up to 30 hrs","Connectivity":"Bluetooth 5.2","Weight":"250 grams"}'),
('Bose QuietComfort Ultra', 'BS-QCU-HP', 'headsets', 429.00, NULL, 14, 4, 103, 'Bose''s flagship headphones add Immersive Audio spatial sound on top of the brand''s renowned noise cancellation.', '/assets/images/product-headset.svg', '{"Noise Cancellation":"World-class ANC","Battery Life":"Up to 24 hrs","Spatial Audio":"Immersive Audio","Weight":"254 grams"}'),
('Samsung Galaxy Buds2 Pro', 'SG-GB2-PRO', 'headsets', 189.00, NULL, 38, 4, 149, '24-bit Hi-Fi audio and intelligent ANC in a compact earbud built to pair seamlessly with Galaxy devices.', '/assets/images/product-headset.svg', '{"Noise Cancellation":"Intelligent ANC","Battery Life":"Up to 5 hrs (ANC on)","Audio":"24-bit Hi-Fi","Water Resistance":"IPX7"}'),

-- Speakers
('JBL Flip 6 Portable Speaker', 'JBL-FL6-BLK', 'speakers', 129.00, NULL, 33, 5, 221, 'Bold JBL Pro Sound in a rugged, waterproof body you can take anywhere — pool, beach, or backyard.', '/assets/images/product-speaker.svg', '{"Output Power":"30W","Battery Life":"Up to 12 hrs","Waterproof Rating":"IP67","Connectivity":"Bluetooth 5.1"}'),
('Sony SRS-XB13 Mini Speaker', 'SN-XB13-BLU', 'speakers', 59.00, NULL, 70, 4, 98, 'A palm-sized speaker with surprisingly deep Extra Bass sound and a rugged, splash-proof design for on-the-go listening.', '/assets/images/product-speaker.svg', '{"Output Power":"5W","Battery Life":"Up to 16 hrs","Waterproof Rating":"IP67","Weight":"265 grams"}'),
('Bose SoundLink Flex', 'BS-SLF-GRY', 'speakers', 149.00, 129.00, 18, 5, 134, 'A rugged, buoyant speaker that delivers Bose''s signature deep, clear sound outdoors or in the shower alike.', '/assets/images/product-speaker.svg', '{"Output Power":"Full-range driver + dual passive radiators","Battery Life":"Up to 12 hrs","Waterproof Rating":"IP67","Buoyant":"Yes"}'),
('Marshall Emberton II', 'MSH-EMB-2', 'speakers', 169.00, NULL, 25, 4, 77, 'Iconic Marshall styling meets 360-degree sound and up to 30 hours of battery life in a compact, travel-ready speaker.', '/assets/images/product-speaker.svg', '{"Output Power":"360-degree sound","Battery Life":"Up to 30 hrs","Waterproof Rating":"IP67","Connectivity":"Bluetooth 5.1"}')

ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name;

-- Default admin account: username "admin", password "admin123" (bcrypt hash below).
-- Change this password after first login in a real deployment.
INSERT INTO users (username, email, password, role) VALUES
('admin', 'izeremaxime1@gmail.com', '$2b$10$bq52kme8fDiaWkrBYD/JCuWHkhQx/7OPAY.hA46YOfpwxBwkCAza.', 'admin')
ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, role = EXCLUDED.role;
