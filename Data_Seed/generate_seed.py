import uuid
import random

tenant_id = "80aa164e-685b-46f0-9ef1-5af54b57b8a0"

categories = {
    "Mens Wear": ["Shirts", "T-Shirts", "Pants", "Denim"],
    "Womens Wear": ["Sarees", "Kurtis", "Dress Material", "Leggings"],
    "Fabrics": ["Shirting", "Suiting"]
}

brands = ["Raymond", "Siyaram", "Louis Philippe", "Van Heusen", "Manyavar", "Biba", "W", "Aurelia", "Liva", "Arvind"]
colors = ["Red", "Blue", "Black", "White", "Green", "Yellow", "Navy", "Beige", "Grey", "Maroon"]
sizes_wear = ["S", "M", "L", "XL", "XXL", "38", "40", "42", "44"]
materials = ["Cotton", "Silk", "Polyester", "Linen", "Denim", "Rayon", "Khadi"]

products = []

def generate_sku(brand, cat, sub, var):
    return f"{brand[:3].upper()}-{cat[:3].upper()}-{sub[:3].upper()}-{var.upper()}-{random.randint(100,999)}"

# Generate 30 records
count = 0
while count < 30:
    cat = random.choice(list(categories.keys()))
    sub = random.choice(categories[cat])
    
    brand = random.choice(brands)
    material = random.choice(materials)
    color = random.choice(colors)
    
    if cat == "Fabrics":
        unit = "Meter"
        size = "N/A"
        name_suffix = f"{material} {color}"
    else:
        unit = "Piece"
        size = random.choice(sizes_wear)
        name_suffix = f"{color} - {size}"

    name = f"{brand} {sub} ({name_suffix})"
    
    sku = generate_sku(brand, cat, sub, f"{color[:1]}{size}")
    
    # Ensure unique SKU
    if any(p['sku'] == sku for p in products):
        continue

    cost = random.randint(300, 2000)
    margin = random.randint(20, 50)
    price = cost * (1 + margin/100)
    price = round(price / 10) * 10 - 1 # .99 like psychological pricing or just round
    price = int(price)
    
    record = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "sku": sku,
        "name": name,
        "category": cat,
        "product_type": sub,
        "price": price,
        "cost": cost,
        "stock": random.randint(10, 100),
        "sector": "Textile",
        "barcode": str(random.randint(100000000000, 999999999999)),
        "composition": material,
        "unit": unit,
        "brand": brand,
        "hsn_code": "6203" if cat == "Mens Wear" else "6204",
        "gst_percentage": 5.00 if price < 1000 else 12.00
    }
    products.append(record)
    count += 1

# Generate SQL
sql = "-- Seed data for Textile Tenant\n"
sql += "INSERT INTO products (id, tenant_id, sku, name, category, product_type, price, cost, stock, sector, barcode, composition, unit, brand, hsn_code, gst_percentage)\nVALUES\n"

values = []
for p in products:
    val = f"('{p['id']}', '{p['tenant_id']}', '{p['sku']}', '{p['name']}', '{p['category']}', '{p['product_type']}', {p['price']}, {p['cost']}, {p['stock']}, '{p['sector']}', '{p['barcode']}', '{p['composition']}', '{p['unit']}', '{p['brand']}', '{p['hsn_code']}', {p['gst_percentage']})"
    values.append(val)

sql += ",\n".join(values) + ";"

print(sql)
