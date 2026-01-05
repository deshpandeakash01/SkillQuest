const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Skill = require("../models/Skill");
const User = require("../models/User");


dotenv.config();

const skills = [
  {
    name: "Python Basics",
    description: "Learn Python fundamentals and syntax",
    category: "Programming",
    creditCost: 5
  },
  {
    name: "JavaScript Fundamentals",
    description: "Core JavaScript concepts for web development",
    category: "Programming",
    creditCost: 5
  },
  {
    name: "React Fundamentals",
    description: "Introduction to React and component-based UI",
    category: "Frontend",
    creditCost: 8
  },
  {
    name: "HTML & CSS",
    description: "Build static and responsive web pages",
    category: "Frontend",
    creditCost: 4
  },
  {
    name: "MongoDB Basics",
    description: "Introduction to MongoDB and NoSQL concepts",
    category: "Database",
    creditCost: 6
  },
  {
    name: "UI UX Design",
    description: "Design user-friendly interfaces",
    category: "Design",
    creditCost: 7
  }
];

const seedSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding");

    // 🔑 1. Get a teacher user
    const teacher = await User.findOne();

    if (!teacher) {
      console.log("Create at least one user before seeding skills");
      process.exit(1);
    }

    // 🧹 2. Clear existing skills (DEV ONLY)
    await Skill.deleteMany();

    // 🧠 3. Attach teacher to each skill
    const skillsWithTeacher = skills.map(skill => ({
      ...skill,
      createdBy: teacher._id
    }));

    // 🚀 4. Insert skills
    await Skill.insertMany(skillsWithTeacher);

    console.log("Skills seeded successfully");
    process.exit();

  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedSkills();