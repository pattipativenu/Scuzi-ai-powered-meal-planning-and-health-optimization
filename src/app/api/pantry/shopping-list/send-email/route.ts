import { NextRequest, NextResponse } from 'next/server';

const CATEGORY_ORDER = ['fridge', 'freezer', 'cupboard'];
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  fridge: 'FRIDGE',
  freezer: 'FREEZER',
  cupboard: 'CUPBOARD'
};

interface ShoppingItem {
  name: string;
  quantity: number;
  category: string;
  unit?: string;
}

interface RequestBody {
  email: string;
  items: ShoppingItem[];
}

interface ItemsByCategory {
  [key: string]: ShoppingItem[];
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function groupItemsByCategory(items: ShoppingItem[]): ItemsByCategory {
  const grouped: ItemsByCategory = {
    fridge: [],
    freezer: [],
    cupboard: []
  };

  items.forEach(item => {
    const category = item.category.toLowerCase();
    if (grouped[category]) {
      grouped[category].push(item);
    } else {
      grouped.fridge.push(item);
    }
  });

  return grouped;
}

function generateTextBody(itemsByCategory: ItemsByCategory, totalItems: number): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let textBody = '=== YOUR SCUZI SHOPPING LIST ===\n';
  textBody += `Generated: ${formattedDate}\n\n`;

  CATEGORY_ORDER.forEach(category => {
    const items = itemsByCategory[category];
    if (items.length > 0) {
      const displayName = CATEGORY_DISPLAY_NAMES[category];
      textBody += `${displayName} (${items.length} item${items.length === 1 ? '' : 's'}):\n`;
      items.forEach(item => {
        const unit = item.unit ? ` ${item.unit}` : '';
        textBody += `- ${item.name}: ${item.quantity}${unit}\n`;
      });
      textBody += '\n';
    }
  });

  textBody += `Total: ${totalItems} item${totalItems === 1 ? '' : 's'}\n`;

  return textBody;
}

function generateHtmlBody(itemsByCategory: ItemsByCategory, totalItems: number): string {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Scuzi Shopping List</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      color: #2c3e50;
      margin-top: 0;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .date {
      color: #7f8c8d;
      font-size: 14px;
      margin-bottom: 20px;
    }
    h3 {
      color: #34495e;
      margin-top: 25px;
      margin-bottom: 10px;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .category-count {
      color: #7f8c8d;
      font-weight: normal;
      font-size: 14px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0 0 15px 0;
    }
    li {
      padding: 10px;
      margin: 5px 0;
      background-color: #f8f9fa;
      border-left: 3px solid #3498db;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }
    li:hover {
      background-color: #e9ecef;
    }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #3498db;
      border-radius: 4px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .item-content {
      flex: 1;
    }
    .item-name {
      font-weight: 600;
      color: #2c3e50;
    }
    .item-quantity {
      color: #7f8c8d;
      margin-left: 5px;
    }
    .total {
      margin-top: 30px;
      padding: 15px;
      background-color: #ecf0f1;
      border-radius: 4px;
      text-align: center;
      font-weight: 600;
      color: #2c3e50;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #95a5a6;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🛒 Your Scuzi Shopping List</h2>
    <p class="date">Generated: ${formattedDate}</p>
`;

  CATEGORY_ORDER.forEach(category => {
    const items = itemsByCategory[category];
    if (items.length > 0) {
      const displayName = CATEGORY_DISPLAY_NAMES[category];
      const emoji = category === 'fridge' ? '🧊' : category === 'freezer' ? '❄️' : '🥫';
      htmlBody += `    <h3>${emoji} ${displayName} <span class="category-count">(${items.length} item${items.length === 1 ? '' : 's'})</span></h3>\n`;
      htmlBody += '    <ul>\n';
      items.forEach(item => {
        const unit = item.unit ? ` ${item.unit}` : '';
        htmlBody += `      <li>
        <div class="checkbox"></div>
        <div class="item-content">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity">: ${item.quantity}${unit}</span>
        </div>
      </li>\n`;
      });
      htmlBody += '    </ul>\n';
    }
  });

  htmlBody += `    <div class="total">
      Total: ${totalItems} item${totalItems === 1 ? '' : 's'}
    </div>
    <div class="footer">
      Happy shopping! 🎉
    </div>
  </div>
</body>
</html>`;

  return htmlBody;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    const trimmedEmail = body.email.trim();
    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ 
        error: "Items array is required",
        code: "MISSING_ITEMS" 
      }, { status: 400 });
    }

    if (body.items.length === 0) {
      return NextResponse.json({ 
        error: "Items array cannot be empty",
        code: "EMPTY_ITEMS" 
      }, { status: 400 });
    }

    for (const item of body.items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return NextResponse.json({ 
          error: "Each item must have a valid name",
          code: "INVALID_ITEM_NAME" 
        }, { status: 400 });
      }

      if (item.quantity === undefined || item.quantity === null || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ 
          error: "Each item must have a valid quantity greater than 0",
          code: "INVALID_ITEM_QUANTITY" 
        }, { status: 400 });
      }
    }

    const sanitizedItems: ShoppingItem[] = body.items.map(item => ({
      name: item.name.trim(),
      quantity: item.quantity,
      category: item.category?.toLowerCase() || 'fridge',
      unit: item.unit?.trim() || undefined
    }));

    const itemsByCategory = groupItemsByCategory(sanitizedItems);
    const totalItems = sanitizedItems.length;

    const textBody = generateTextBody(itemsByCategory, totalItems);
    const htmlBody = generateHtmlBody(itemsByCategory, totalItems);

    return NextResponse.json({
      success: true,
      message: "Shopping list prepared for email",
      emailData: {
        to: trimmedEmail,
        subject: "Your Scuzi Shopping List",
        textBody,
        htmlBody,
        itemsByCategory,
        totalItems
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}