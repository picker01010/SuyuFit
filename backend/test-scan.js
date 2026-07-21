const fs = require('fs');
const path = require('path');

// Sample nutrition label base64 (small test image)
const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testScan() {
  try {
    console.log("Testing AI scan endpoint...\n");
    
    const response = await fetch("http://localhost:3001/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: testImage })
    });
    
    const result = await response.json();
    console.log("Response:", JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log("\n✓ SUCCESS! AI provider:", result.ai);
      console.log("Product:", result.data.name);
      console.log("Per 100g - kcal:", result.data.per100.k, "p:", result.data.per100.p, "c:", result.data.per100.c, "f:", result.data.per100.f);
    } else {
      console.log("\n✗ FAILED:", result.error);
      console.log("Debug:", result.debug);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testScan();
