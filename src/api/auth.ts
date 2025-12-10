import { db } from "../db";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { extractUser } from "../middleware";

export async function handleSignup(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const existingUser = db.query("SELECT id FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already registered" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.run(
      "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [userId, email, passwordHash, now, now]
    );

    // Create default user settings
    db.run(
      "INSERT INTO user_settings (user_id, result_layout, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [userId, "horizontal", now, now]
    );

    // Generate JWT token
    const token = signToken({ userId, email });

    return new Response(JSON.stringify({ 
      user: { id: userId, email },
      token 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleLogin(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find user
    const user = db.query("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email });

    return new Response(JSON.stringify({ 
      user: { id: user.id, email: user.email },
      token 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleMe(req: Request) {
  try {
    const user = extractUser(req);
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user settings
    const settings = db.query("SELECT * FROM user_settings WHERE user_id = ?").get(user.userId) as any;

    return new Response(JSON.stringify({ 
      user: { id: user.userId, email: user.email },
      settings: settings || { result_layout: "horizontal" }
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Me error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
