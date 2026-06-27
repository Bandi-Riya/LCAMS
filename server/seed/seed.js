require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const { Role } = require("../models/Role");
const User = require("../models/User");
const Block = require("../models/Block");
const Floor = require("../models/Floor");
const { MaintenanceLog } = require("../models/MaintenanceLog");
const { Room } = require("../models/Room");
const Asset = require("../models/Asset");

// ── Role permissions ──────────────────────────────────────────────────────────
const rolePermissions = {
  Admin: [
    "view_structure", "manage_structure", "add_asset", "edit_asset",
    "update_asset_status", "report_maintenance_issue",
    "update_maintenance_status", "assign_maintenance_task",
    "view_analytics_dashboard", "export_reports", "manage_users",
  ],
  Staff: [
    "view_structure", "add_asset", "edit_asset", "update_asset_status",
    "report_maintenance_issue", "view_analytics_dashboard", "export_reports",
  ],
  Maintenance: ["view_structure", "update_asset_status", "update_maintenance_status"],
  Viewer: ["view_structure"],
};

// ── Users ─────────────────────────────────────────────────────────────────────
const usersToSeed = [
  { username: "admin",          email: "admin@lcams.edu",       password: "Admin@123", department: "Administration", role_name: "Admin" },
  { username: "riya.staff",     email: "staff.riya@lcams.edu",  password: "Staff@123", department: "CSE",            role_name: "Staff" },
  { username: "tech1",          email: "tech1@lcams.edu",        password: "Tech@123",  department: "Maintenance",    role_name: "Maintenance" },
  { username: "student.viewer", email: "student@lcams.edu",      password: "View@123",  department: "General",        role_name: "Viewer" },
];

// ── Block definitions ─────────────────────────────────────────────────────────
const blocksData = [
  { block_name: "Block A", block_code: "BLK-A", description: "Main Academic Block — CSE & IT Departments" },
  { block_name: "Block B", block_code: "BLK-B", description: "Science & Engineering Labs Block" },
  { block_name: "Block C", block_code: "BLK-C", description: "Administration, Arts & Commerce Block" },
];

// ── Floors per block (Ground + 3 upper floors) ────────────────────────────────
const floorDefs = [
  { floor_number: 0, floor_label: "Ground Floor" },
  { floor_number: 1, floor_label: "First Floor"  },
  { floor_number: 2, floor_label: "Second Floor" },
  { floor_number: 3, floor_label: "Third Floor"  },
];

// ── Room builder ──────────────────────────────────────────────────────────────
// Room types allowed by your schema ENUM:
// Classroom | Smart Classroom | Laboratory | HOD Office |
// Faculty Room | Auditorium | Conference Room | Store Room | Other

function buildRooms(blockCode, floorNumber) {
  const p  = blockCode.replace("BLK-", ""); // A, B, C
  const fn = floorNumber;                    // 0, 1, 2, 3
  const rooms = [];

  // ── Classrooms × 2 (every floor) ─────────────────────────────────────────
  rooms.push({
    room_number:      `${p}${fn}01`,
    room_name:        `Classroom ${p}${fn}01`,
    room_type:        "Classroom",
    seating_capacity: 60,
    has_projector:    false,
    has_ac:           false,
    landmark:         "Left wing, near staircase",
  });
  rooms.push({
    room_number:      `${p}${fn}02`,
    room_name:        `Classroom ${p}${fn}02`,
    room_type:        "Classroom",
    seating_capacity: 60,
    has_projector:    false,
    has_ac:           false,
    landmark:         "Right wing, end of corridor",
  });

  // ── Smart Classroom × 1 (floors 1 and above only) ────────────────────────
  if (fn >= 1) {
    rooms.push({
      room_number:      `${p}${fn}03`,
      room_name:        `Smart Classroom ${p}${fn}03`,
      room_type:        "Smart Classroom",
      seating_capacity: 50,
      has_projector:    true,
      has_ac:           true,
      landmark:         "Center of corridor",
    });
  }

  // ── Laboratory × 1 (every floor, name varies by block) ───────────────────
  const labName = { A: "Computer Lab", B: "Physics Lab", C: "Language Lab" }[p];
  rooms.push({
    room_number:      `${p}${fn}04`,
    room_name:        `${labName} ${fn + 1}`,
    room_type:        "Laboratory",
    seating_capacity: 30,
    has_projector:    true,
    has_ac:           true,
    landmark:         "Adjacent to store room",
  });

  // ── Faculty Rooms × 2 (every floor) ──────────────────────────────────────
  rooms.push({
    room_number:      `${p}${fn}05`,
    room_name:        `Faculty Room ${p}${fn}05`,
    room_type:        "Faculty Room",
    seating_capacity: 10,
    has_projector:    false,
    has_ac:           true,
    landmark:         "Opposite to staircase",
  });
  rooms.push({
    room_number:      `${p}${fn}06`,
    room_name:        `Faculty Room ${p}${fn}06`,
    room_type:        "Faculty Room",
    seating_capacity: 10,
    has_projector:    false,
    has_ac:           false,
    landmark:         "End of left corridor",
  });

  // ── HOD Office (Ground floor only, one per block) ─────────────────────────
  if (fn === 0) {
    const dept = { A: "CSE", B: "Science", C: "Arts" }[p];
    rooms.push({
      room_number:      `${p}${fn}07`,
      room_name:        `HOD Office - ${dept}`,
      room_type:        "HOD Office",
      seating_capacity: 5,
      has_projector:    false,
      has_ac:           true,
      landmark:         "Near main entrance, right side",
    });
  }

  // ── Auditorium (Ground floor, Block A only) ───────────────────────────────
  if (fn === 0 && p === "A") {
    rooms.push({
      room_number:      `${p}${fn}08`,
      room_name:        "Main Auditorium",
      room_type:        "Auditorium",
      seating_capacity: 300,
      has_projector:    true,
      has_ac:           true,
      landmark:         "Ground floor, main wing — visible from main gate",
    });
  }

  // ── Conference Room (First floor only, one per block) ─────────────────────
  if (fn === 1) {
    rooms.push({
      room_number:      `${p}${fn}09`,
      room_name:        `Conference Room - ${p} Block`,
      room_type:        "Conference Room",
      seating_capacity: 20,
      has_projector:    true,
      has_ac:           true,
      landmark:         "First floor, near elevator",
    });
  }

  // ── Boys Washroom (every floor) ───────────────────────────────────────────
  rooms.push({
    room_number:      `${p}${fn}WB`,
    room_name:        `Boys Washroom - ${p} Block Floor ${fn}`,
    room_type:        "Other",
    seating_capacity: 0,
    has_projector:    false,
    has_ac:           false,
    landmark:         "End of right corridor",
  });

  // ── Girls Washroom (every floor) ──────────────────────────────────────────
  rooms.push({
    room_number:      `${p}${fn}WG`,
    room_name:        `Girls Washroom - ${p} Block Floor ${fn}`,
    room_type:        "Other",
    seating_capacity: 0,
    has_projector:    false,
    has_ac:           false,
    landmark:         "End of left corridor",
  });

  // ── Store Room (Ground floor only, one per block) ─────────────────────────
  if (fn === 0) {
    rooms.push({
      room_number:      `${p}${fn}SR`,
      room_name:        `Store Room - ${p} Block`,
      room_type:        "Store Room",
      seating_capacity: 0,
      has_projector:    false,
      has_ac:           false,
      landmark:         "Behind staircase, ground floor",
    });
  }

  return rooms;
}

// ── Main runner ───────────────────────────────────────────────────────────────
const run = async () => {
  try {
    console.log("\n🚀 Seeding started...\n");
    await connectDB();

    // ── 1. Roles ────────────────────────────────────────────────────────────
    console.log("🔐 Seeding roles...");
    for (const roleName of Object.keys(rolePermissions)) {
      await Role.findOneAndUpdate(
        { role_name: roleName },
        { role_name: roleName, permissions: rolePermissions[roleName] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`   ✅ Role: ${roleName}`);
    }

    // ── 2. Users ────────────────────────────────────────────────────────────
    console.log("\n👤 Seeding users...");
    for (const userData of usersToSeed) {
      const role = await Role.findOne({ role_name: userData.role_name });
      if (!role) throw new Error(`Role "${userData.role_name}" not found.`);
      const password_hash = await bcrypt.hash(userData.password, 10);
      await User.findOneAndUpdate(
        { email: userData.email.toLowerCase() },
        {
          username:      userData.username,
          email:         userData.email.toLowerCase(),
          password_hash,
          department:    userData.department,
          role_id:       role._id,
          is_active:     true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`   ✅ User: ${userData.email} (${userData.role_name})`);
    }

    // ── 3. Clear old structure data ─────────────────────────────────────────
    console.log("\n🧹 Clearing old Block / Floor / Room data...");
    await Room.deleteMany({});
    await Floor.deleteMany({});
    await Block.deleteMany({});
    console.log("   Done.\n");

    // ── 4. Blocks ───────────────────────────────────────────────────────────
    console.log("🏗️  Seeding blocks...");
    const insertedBlocks = await Block.insertMany(blocksData);
    insertedBlocks.forEach(b => console.log(`   ✅ ${b.block_name}`));

    // ── 5. Floors ───────────────────────────────────────────────────────────
    console.log("\n📐 Seeding floors...");
    const allFloors = [];
    for (const block of insertedBlocks) {
      for (const fd of floorDefs) {
        const floor = await Floor.create({
          floor_number: fd.floor_number,
          floor_label:  fd.floor_label,
          block_id:     block._id,
        });
        allFloors.push({ ...floor.toObject(), _blockCode: block.block_code });
        console.log(`   ✅ ${block.block_name} → ${fd.floor_label}`);
      }
    }

    // ── 6. Rooms ────────────────────────────────────────────────────────────
    console.log("\n🚪 Seeding rooms...");
    let totalRooms = 0;

    for (const block of insertedBlocks) {
      const blockFloors = allFloors.filter(
        f => f.block_id.toString() === block._id.toString()
      );
      for (const floor of blockFloors) {
        const roomDefs = buildRooms(block.block_code, floor.floor_number);
        for (const def of roomDefs) {
          await Room.create({ ...def, floor_id: floor._id });
          totalRooms++;
          console.log(`   ✅ ${block.block_name} | ${floor.floor_label} | ${def.room_number} — ${def.room_name}`);
        }
      }
    }

    // ── 7. Assets ────────────────────────────────────────────────────────────
    console.log("\n📦 Seeding assets...");

    // Clear existing assets first
    await Asset.deleteMany({});
    console.log("   Cleared existing assets.");

    // Fetch all rooms that were just created
    const allRooms = await Room.find({});
    console.log(`   Found ${allRooms.length} rooms to populate with assets.`);

    if (allRooms.length === 0) {
      console.log("   ⚠️  No rooms found — skipping asset seeding.");
    }

    // Asset templates — mixed across categories
    // Each room gets a filtered subset based on its room_type
    const assetTemplates = {
      Classroom: [
        { name: "Ceiling Fan",        category: "Electrical",        brand: "Usha",     cost: 3500  },
        { name: "Whiteboard",         category: "Furniture",         brand: "Camlin",   cost: 2500  },
        { name: "Student Desk",       category: "Furniture",         brand: "Supreme",  cost: 1200  },
        { name: "Teacher Table",      category: "Furniture",         brand: "Godrej",   cost: 4500  },
        { name: "Chair",              category: "Furniture",         brand: "Supreme",  cost: 800   },
        { name: "Tubelight Fixture",  category: "Electrical",        brand: "Philips",  cost: 1200  },
        { name: "Fire Extinguisher",  category: "Safety Equipment",  brand: "Minimax",  cost: 2200  },
      ],
      "Smart Classroom": [
        { name: "Dell Projector",     category: "Electronics",       brand: "Dell",     cost: 45000 },
        { name: "Projection Screen",  category: "Electronics",       brand: "Epson",    cost: 8000  },
        { name: "Smart Board",        category: "Electronics",       brand: "Samsung",  cost: 85000 },
        { name: "Desktop Computer",   category: "IT Infrastructure", brand: "HP",       cost: 35000 },
        { name: "UPS",                category: "Electrical",        brand: "APC",      cost: 6000  },
        { name: "Air Conditioner",    category: "Electrical",        brand: "Voltas",   cost: 38000 },
        { name: "Speaker System",     category: "Electronics",       brand: "JBL",      cost: 12000 },
        { name: "Webcam",             category: "IT Infrastructure", brand: "Logitech", cost: 4500  },
      ],
      Laboratory: [
        { name: "Lab Computer",       category: "IT Infrastructure", brand: "HP",       cost: 35000 },
        { name: "Network Switch",     category: "IT Infrastructure", brand: "Cisco",    cost: 12000 },
        { name: "Lab Bench",          category: "Furniture",         brand: "Local",    cost: 8000  },
        { name: "Oscilloscope",       category: "Laboratory Equipment", brand: "Tektronix", cost: 25000 },
        { name: "Multimeter",         category: "Laboratory Equipment", brand: "Fluke",  cost: 4500  },
        { name: "UPS",                category: "Electrical",        brand: "APC",      cost: 6000  },
        { name: "Air Conditioner",    category: "Electrical",        brand: "Daikin",   cost: 42000 },
        { name: "Fire Extinguisher",  category: "Safety Equipment",  brand: "Minimax",  cost: 2200  },
        { name: "Printer",            category: "IT Infrastructure", brand: "Canon",    cost: 15000 },
      ],
      "HOD Office": [
        { name: "Desktop Computer",   category: "IT Infrastructure", brand: "Dell",     cost: 40000 },
        { name: "Office Chair",       category: "Furniture",         brand: "Godrej",   cost: 8500  },
        { name: "Office Desk",        category: "Furniture",         brand: "Godrej",   cost: 12000 },
        { name: "Air Conditioner",    category: "Electrical",        brand: "Voltas",   cost: 38000 },
        { name: "Printer",            category: "IT Infrastructure", brand: "HP",       cost: 18000 },
        { name: "Telephone",          category: "Electronics",       brand: "Beetel",   cost: 1500  },
      ],
      "Faculty Room": [
        { name: "Office Chair",       category: "Furniture",         brand: "Godrej",   cost: 6000  },
        { name: "Writing Table",      category: "Furniture",         brand: "Supreme",  cost: 5500  },
        { name: "Ceiling Fan",        category: "Electrical",        brand: "Usha",     cost: 3500  },
        { name: "Desktop Computer",   category: "IT Infrastructure", brand: "HP",       cost: 35000 },
        { name: "Telephone",          category: "Electronics",       brand: "Beetel",   cost: 1500  },
        { name: "Filing Cabinet",     category: "Furniture",         brand: "Godrej",   cost: 9000  },
      ],
      Auditorium: [
        { name: "Stage Projector",    category: "Electronics",       brand: "Epson",    cost: 95000 },
        { name: "Microphone Set",     category: "Electronics",       brand: "Sennheiser", cost: 22000 },
        { name: "Speaker System",     category: "Electronics",       brand: "JBL",      cost: 45000 },
        { name: "Amplifier",          category: "Electronics",       brand: "Yamaha",   cost: 18000 },
        { name: "Air Conditioner",    category: "Electrical",        brand: "Blue Star", cost: 55000 },
        { name: "Stage Light",        category: "Electrical",        brand: "Philips",  cost: 8000  },
        { name: "Fire Extinguisher",  category: "Safety Equipment",  brand: "Minimax",  cost: 2200  },
        { name: "Podium",             category: "Furniture",         brand: "Local",    cost: 6500  },
      ],
      "Conference Room": [
        { name: "Conference Table",   category: "Furniture",         brand: "Godrej",   cost: 35000 },
        { name: "Projector",          category: "Electronics",       brand: "Epson",    cost: 45000 },
        { name: "Projection Screen",  category: "Electronics",       brand: "Epson",    cost: 8000  },
        { name: "Air Conditioner",    category: "Electrical",        brand: "Daikin",   cost: 42000 },
        { name: "Video Conference Unit", category: "IT Infrastructure", brand: "Poly",  cost: 55000 },
        { name: "Whiteboard",         category: "Furniture",         brand: "Camlin",   cost: 3500  },
      ],
      "Store Room": [
        { name: "Storage Rack",       category: "Furniture",         brand: "Local",    cost: 4500  },
        { name: "Fire Extinguisher",  category: "Safety Equipment",  brand: "Minimax",  cost: 2200  },
      ],
      Other: [
        { name: "Exhaust Fan",        category: "Electrical",        brand: "Crompton", cost: 2500  },
        { name: "Mirror",             category: "Furniture",         brand: "Local",    cost: 800   },
      ],
    };

    // Status pool — mostly Working, some Damaged/Under Maintenance
    const statusPool = [
      "Working", "Working", "Working", "Working", "Working",
      "Working", "Working", "Damaged", "Under Maintenance", "Working",
    ];

    let assetCounter = 1;
    let totalAssets  = 0;

    for (const room of allRooms) {
      const templates = assetTemplates[room.room_type] || assetTemplates["Other"];

      for (let i = 0; i < templates.length; i++) {
        const tmpl = templates[i];

        // Pad counter to 4 digits: AST-0001, AST-0002 ...
        const asset_code = `AST-${String(assetCounter).padStart(4, "0")}`;
        assetCounter++;

        const status       = statusPool[totalAssets % statusPool.length];
        const purchaseYear = 2020 + (totalAssets % 4); // 2020–2023

        await Asset.create({
          asset_name:      `${tmpl.name}`,
          asset_code,
          category:        tmpl.category,
          brand:           tmpl.brand,
          model_number:    `MDL-${asset_code}`,
          serial_number:   `SRL-${asset_code}`,
          purchase_date:   new Date(`${purchaseYear}-06-15`),
          purchase_cost:   tmpl.cost,
          warranty_expiry: new Date(`${purchaseYear + 3}-06-14`),
          status,
          room_id:         room._id,
        });

        totalAssets++;
      }

      console.log(`   ✅ ${room.room_number} (${room.room_type}) — ${templates.length} assets added`);
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    // ── Summary ─────────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("✅ Seeding complete!");
    console.log(`   Roles  : ${Object.keys(rolePermissions).length}`);
    console.log(`   Users  : ${usersToSeed.length}`);
    console.log(`   Blocks : ${insertedBlocks.length}`);
    console.log(`   Floors : ${allFloors.length}`);
    console.log(`   Rooms  : ${totalRooms}`);
    console.log(`   Assets : ${totalAssets}`);
    console.log("════════════════════════════════════════\n");

    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    if (err.code === 11000) {
      console.error("   Duplicate key — the script clears structure data but not roles/users.");
      console.error("   If users already exist that is fine — upsert handles them.");
    }
    process.exit(1);
  }
};

run();