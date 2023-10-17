import NextImage from 'next/image'
import React, { useState } from 'react';

export default function Generator() {
    const [generatedImages, setGeneratedImages] = useState([]);

    async function createImageFromBlob(blob) {
        return new Promise((resolve) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.src = URL.createObjectURL(blob);
        });
    }

    async function generateImages() {
        let numImages = document.getElementById("numImages").value;
        let layers = [
            document.getElementById("layer1"),
            document.getElementById("layer2"),
            document.getElementById("layer3"),
            document.getElementById("layer4")
        ];
        let previewContainer = document.getElementById("previewContainer");

        let canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        let ctx = canvas.getContext("2d");

        // 既存のプレビューをクリア
        previewContainer.innerHTML = "";
        let localGeneratedImages = [];

        for (let i = 0; i < numImages; i++) {
            let images = [];
            for (let j = layers.length - 1; j >= 0; j--) {
                if (layers[j].files.length > 0) {
                    let randomIndex = Math.floor(Math.random() * layers[j].files.length);
                    let imgBlob = await createImageFromBlob(layers[j].files[randomIndex]);
                    images.push(imgBlob);
                }
            }

            // Draw images onto canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let img of images) {
                ctx.drawImage(img, 0, 0, 500, 500);
            }

            // Save the generated image
            let imageData = canvas.toDataURL();
            localGeneratedImages.push(imageData);

            // Add to preview container
            let imgElement = document.createElement("img");
            imgElement.src = imageData;
            imgElement.className = "previewImage";
            previewContainer.appendChild(imgElement);
        }
        setGeneratedImages(localGeneratedImages);
        alert("画像生成完了");
    }

    async function uploadFileToNFTStorage(base64Data) {
        const apiEndpoint = "https://api.nft.storage/upload";
        const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA5OUZCNTk5MTFiMDVmNjk5MzBlNzJGN0VENzlENkJmODc1OTNFMkEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5NjA0NjIxMzU2NiwibmFtZSI6Ik5GVF9URVNUIn0.tcmpx4NdFaoQ7rsDzecGfdKW0fhidgOh4UpSIiATcI0";  // こちらをあなたのAPIキーに置き換えてください

        // Base64データをBlobに変換
        const blob = await (await fetch(base64Data)).blob();

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': blob.type,
            },
            body: blob  // Blobオブジェクトを指定
        });

        if (response.ok) {
            const jsonData = await response.json();
            return jsonData.value.cid;  // CIDを返す
        } else {
            const errorData = await response.json();
            throw new Error(`Error uploading file: ${errorData.error.message}`);
        }
    }

    async function uploadImagesAndGenerateJson() {
        if (generatedImages.length === 0) {
            alert("先に画像を生成してください");
            return;
        }
    
        const brandId = document.getElementById('brandId').value.padStart(6, '0');
        const itemId = document.getElementById('itemId').value.padStart(6, '0');
        const brandName = document.getElementById('brandName').value;
        const itemName = document.getElementById('itemName').value;
        const itemColor = document.getElementById('itemColor').value;
        const itemOrigin = document.getElementById('itemOrigin').value;
        const numFiles = parseInt(document.getElementById('numFiles').value);
        if (isNaN(numFiles) || numFiles <= 0 || numFiles > generatedImages.length) {
            alert(`指定したNumは無効です。1から${generatedImages.length}の間の値を入力してください。`);
            return;
        }
    
        for (let i = 0; i < generatedImages.length; i++) {
            try {
                const cid = await uploadFileToNFTStorage(generatedImages[i]);
                console.log(`Image ${i} CID:`, cid);
    
                const combinedItemId = `${brandId}${itemId}${(i + 1).toString().padStart(6, '0')}`;
                const jsonData = {
                    name: `Showmee_ ${combinedItemId}`,
                    description: "This is showmee Test Nft",
                    image: `ipfs://${cid}.ipfs.nftstorage.link`,
                    dna: combinedItemId,
                    edition: i + 1,
                    date: Date.now(),
                    attributes: [
                        { trait_type: "brand", value: brandName },
                        { trait_type: "item", value: itemName },
                        { trait_type: "color", value: itemColor },
                        { trait_type: "origin", value: itemOrigin },
                        { trait_type: "brandId", value: brandId },
                        { trait_type: "itemId", value: itemId },
                        { trait_type: "combinedItemId", value: combinedItemId }
                    ]
                };
    
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'text/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `item_${combinedItemId}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
    
            } catch (error) {
                console.error(`Error processing image ${i}:`, error.message);
            }
        }
    }

    return (
        <div>
            <h2>フォルダアップロード</h2>
            <form id="uploadForm">
                <label>ブランドロゴ:</label>
                <input type="file" multiple id="layer1" />
                <br />
                <label>アイテム名:</label>
                <input type="file" multiple id="layer2" />
                <br />
                <label>商品画像:</label>
                <input type="file" multiple id="layer3" />
                <br />
                <label>背景:</label>
                <input type="file" multiple id="layer4" />
                <br /><br />
                <label>生成枚数:</label>
                <input type="number" id="numImages" />
                <button type="button" onClick={generateImages}>生成</button>
            </form>

            <h2>プレビュー</h2>
            <div id="previewContainer">
                {/* プレビュー画像はこちらに動的に追加されます */}
            </div>
            <br />
            <label>ブランドID: <input type="text" maxLength="6" id="brandId" /></label><br />
            <label>アイテムID: <input type="text" maxLength="6" id="itemId" /></label><br />
            <label>ブランド名: <input type="text" id="brandName" /></label><br />
            <label>アイテム名: <input type="text" id="itemName" /></label><br />
            <label>アイテム色: <input type="text" id="itemColor" /></label><br />
            <label>アイテム生産地: <input type="text" id="itemOrigin" /></label><br />
            <label>Num: <input type="number" id="numFiles" /></label><br />
            <button onClick={uploadImagesAndGenerateJson}>アップロード & JSON生成</button>
            <p id="cidOutput"></p>
        </div>
    );
    }    