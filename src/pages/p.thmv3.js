import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    // 🎨 1. 運行高級排版引擎（強制切出圓形頭像、按鈕陰影等）
    美化網頁極致排版();

    // 🔍 2. 獲取網址裡的銘牌 ID
    let query = wixLocation.query;
    let binCode = query.id;

    if (!binCode) {
        $w('#petName').text = "❌ 未找到銘牌資訊";
        隱藏所有主要元件();
        return;
    }

    // 🗄️ 3. 查詢資料庫
    try {
        let results = await wixData.query("bins")
            .eq("binCode", binCode)
            .find();

        if (results.items.length > 0) {
            let petData = results.items[0];

            // 🐕 4. 如果銘牌已綁定
            if (petData.isActivated === true || petData.status === true) {
                
                // 填入寵物名字（保留你的 Emoji 格式）
                let name = petData.petName || "阿布";
                $w('#petName').text = "我是 [ " + name + " ] 🐶";
                
                // 設置綠色電話按鈕：點擊直接打電話
                if (petData.ownerPhone) {
                    $w('#callBtn').label = "📞 撥打主人電話\n(" + petData.ownerPhone + ")";
                    $w('#callBtn').link = "tel:" + petData.ownerPhone;
                } else {
                    $w('#callBtn').label = "📞 主人未留電話";
                }

                // 設置圖片
                if (petData.petPhoto) {
                    $w('#petPhoto').src = petData.petPhoto;
                }

                // 📍 5. 核心：藍色定位按鈕點擊事件
                $w('#locationBtn').onClick(() => {
                    獲取路人位置並發送(binCode, name);
                });

            } else {
                $w('#petName').text = "🎉 這是一塊全新銘牌！";
                $w('#callBtn').label = "前往後台綁定";
                $w('#locationBtn').hide();
            }
        } else {
            $w('#petName').text = "🔍 銘牌編碼未登記";
            隱藏所有主要元件();
        }
    } catch (error) {
        console.error(error);
    }
});

// 🎨 完美還原圖片效果的排版函數
function 美化網頁極致排版() {
    // 讓圖片變成完美的正圓形頭像（像頭像一樣）
    $w('#petPhoto').style.borderRadius = "50%";
    
    // 給頭像加上淡淡的灰色邊框，顯得更精緻
    $w('#petPhoto').style.borderColor = "#E5E7EB";
    $w('#petPhoto').style.borderWidth = "4px";

    // 寵物名字加粗、加大、顏色
    $w('#petName').style.color = "#1A2530";
    
    // 提示小字變成柔和的灰色
    $w('#tipText').style.color = "#7F8C8D";
}

// 📍 GPS 地理定位核心邏輯
function 獲取路人位置並發送(binCode, petName) {
    $w('#locationBtn').label = "⏳ 正在獲取位置...";

    // 呼叫手機原生的全球定位 GPS 系統
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async function (position) {
                let lat = position.coords.latitude;  // 緯度
                let lng = position.coords.longitude; // 經度
                
                // 產生一個 Google 地圖網址
                let mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                
                console.log("成功獲取路人位置:", mapUrl);

                // 【業務動作】：把路人的定位寫回資料庫的通知表（notices）
                try {
                    await wixData.insert("notices", {
                        "binCode": binCode,
                        "title": `🚨 寵物 [${petName}] 被掃描！`,
                        "content": `好心人點擊了定位按鈕！目前寵物所在位置的 Google 地圖鏈接為：${mapUrl}`,
                        "createdAt": new Date()
                    });
                    
                    $w('#locationBtn').label = "✅ 位置已成功發送給主人！";
                    $w('#locationBtn').style.backgroundColor = "#2ECC71"; // 變成綠色代表成功
                } catch (err) {
                    $w('#locationBtn').label = "❌ 發送失敗，請重試";
                }
            },
            function (error) {
                // 如果路人拒絕了 GPS 權限
                $w('#locationBtn').label = "❌ 權限遭拒，無法獲取定位";
                alert("請允許瀏覽器獲取 GPS 定位權限，以便將準確位置通知主人！");
            },
            { enableHighAccuracy: true, timeout: 10000 } // 高精度 GPS 模式
        );
    } else {
        $w('#locationBtn').label = "❌ 您的手機瀏覽器不支持定位";
    }
}

function 隱藏所有主要元件() {
    $w('#petPhoto').hide();
    $w('#callBtn').hide();
    $w('#locationBtn').hide();
    $w('#tipText').hide();
}