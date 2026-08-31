import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

// Headers must match the importer in AdminProducts.tsx exactly.
// Multi-value fields (sizes, colors, tags, images, videos) use the pipe "|" separator.
// "category" matches the category NAME (case-insensitive).
// "description" supports multi-line text — use \n for line breaks (escaped, not real newlines).
// "images" and "videos" must be publicly reachable URLs. To upload local files,
// open the product in the admin editor and use the file picker — the CSV path is URL-only.
const HEADERS = [
  "name",
  "slug",
  "sku",
  "brand",
  "material",
  "weight",
  "price",
  "compare_at_price",
  "stock_quantity",
  "in_stock",
  "featured",
  "category",
  "sizes",
  "colors",
  "tags",
  "images",
  "videos",
  "description",
];

const SAMPLE_ROWS: (string | number)[][] = [
  [
    "Classic Tee",
    "classic-tee",
    "CT-001",
    "TDEV",
    "100% Cotton",
    0.2,
    29.99,
    39.99,
    50,
    "true",
    "true",
    "T-Shirts",
    "S|M|L|XL",
    "Black|White|Navy",
    "casual|basics",
    "https://example.com/tee-front.jpg|https://example.com/tee-back.jpg",
    "https://example.com/tee-360.mp4",
    "Premium 240gsm combed cotton with a relaxed fit.\\n\\n• Pre-shrunk, ring-spun yarn\\n• Reinforced double-stitch collar\\n• Designed in NYC, sewn in Portugal",
  ],
  [
    "Denim Jacket",
    "denim-jacket",
    "DJ-001",
    "TDEV",
    "Denim",
    0.8,
    89.99,
    "",
    25,
    "true",
    "false",
    "Outerwear",
    "S|M|L",
    "Blue|Black",
    "premium|outerwear",
    "https://example.com/denim-front.jpg|https://example.com/denim-side.jpg|https://example.com/denim-detail.jpg",
    "",
    "Vintage-wash 14oz selvedge denim jacket.\\nButton-front, two chest pockets, classic Type III silhouette.",
  ],
  [
    "Graphic Hoodie",
    "graphic-hoodie",
    "GH-001",
    "TDEV",
    "Cotton Blend",
    0.5,
    59.99,
    74.99,
    30,
    "true",
    "true",
    "Hoodies",
    "M|L|XL|XXL",
    "Gray|Black",
    "collab|streetwear",
    "https://example.com/hoodie-1.jpg|https://example.com/hoodie-2.jpg",
    "https://example.com/hoodie-lookbook.mp4|https://example.com/hoodie-detail.mp4",
    "Artist collaboration hoodie — limited run of 300.\\n\\nHeavyweight 450gsm fleece, brushed interior, kangaroo pocket, ribbed cuffs and hem.",
  ],
];

const esc = (v: string | number) => {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""').replace(/\n/g, "\\n")}"`;
};

const buildCSV = () => {
  const headerLine = HEADERS.map(esc).join(",");
  const rowLines = SAMPLE_ROWS.map((row) => row.map(esc).join(","));
  return [headerLine, ...rowLines].join("\n");
};

const AdminCSVTemplate = () => {
  const download = () => {
    // BOM so Excel/Numbers/Google Sheets detect UTF-8 correctly
    const csv = "\uFEFF" + buildCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded", {
      description:
        "Use | to separate sizes, colors, tags, images, and videos. Use \\n inside descriptions for line breaks. For local image/video files, upload them in the product editor instead.",
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={download} className="gap-2">
      <Download size={14} /> Download CSV Template
    </Button>
  );
};

export default AdminCSVTemplate;
