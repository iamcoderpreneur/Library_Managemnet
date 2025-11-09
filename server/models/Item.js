import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ----------------------------
// Get low stock items (define before :id)
// ----------------------------
router.get("/alerts/low-stock", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM items WHERE StockQuantity <= ReorderLevel AND IsActive = 1"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
});

// ----------------------------
// Get categories (define before :id)
// ----------------------------
router.get("/meta/categories", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT Category FROM items WHERE IsActive = 1"
    );
    res.json(rows.map((r) => r.Category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ----------------------------
// Get all items
// ----------------------------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [items] = await pool.query("SELECT * FROM items WHERE IsActive = 1");
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// ----------------------------
// Get item by ID
// ----------------------------
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM items WHERE ItemID = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// ----------------------------
// Create new item
// ----------------------------
router.post("/", async (req, res) => {
  try {
    const {
      ItemName,
      Alias,
      PartNumber,
      Description,
      Category = "General",
      UOM = "nos",
      HSNCode,
      StockQuantity = 0,
      UnitPrice = 0,
      TotalValue = 0,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO items 
      (ItemName, Alias, PartNumber, Description, Category, UOM, HSNCode, StockQuantity, UnitPrice, TotalValue, IsActive, CreatedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURDATE())`,
      [
        ItemName,
        Alias,
        PartNumber,
        Description,
        Category,
        UOM,
        HSNCode,
        StockQuantity,
        UnitPrice,
        TotalValue,
      ]
    );

    res.status(201).json({
      ItemID: result.insertId,
      ItemName,
      Alias,
      PartNumber,
      Description,
      Category,
      UOM,
      HSNCode,
      StockQuantity,
      UnitPrice,
      TotalValue,
      IsActive: true,
      CreatedDate: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// ----------------------------
// Bulk insert items
// ----------------------------
router.post("/bulk", async (req, res) => {
  try {
    const { items } = req.body;

    const values = items.map((item) => [
      item.ItemName || "",
      item.Alias || "",
      item.PartNumber || "",
      item.Description || "",
      item.Category || "General",
      item.UOM || "nos",
      item.HSNCode || "",
      parseInt(item.StockQuantity) || 0,
      parseFloat(item.UnitPrice) || 0,
      item.TotalValue || 0,
      1,
      new Date().toISOString().split("T")[0],
    ]);

    await pool.query(
      `INSERT INTO items 
      (ItemName, Alias, PartNumber, Description, Category, UOM, HSNCode, StockQuantity, UnitPrice, TotalValue, IsActive, CreatedDate)
      VALUES ?`,
      [values]
    );

    res.status(201).json({ message: `${items.length} items created successfully` });
  } catch (error) {
    console.error("Error bulk inserting items:", error);
    res.status(500).json({ error: "Failed to create items" });
  }
});

// ----------------------------
// Update item
// ----------------------------
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE items SET ? WHERE ItemID = ?", [
      req.body,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// ----------------------------
// Update stock quantity
// ----------------------------
router.patch("/:id/stock", authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const [result] = await pool.query(
      "UPDATE items SET StockQuantity = ? WHERE ItemID = ?",
      [quantity, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// ----------------------------
// Soft delete item
// ----------------------------
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE items SET IsActive = 0 WHERE ItemID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export { router as itemRoutes };
