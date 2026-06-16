const { chromium } = require("playwright");
const fs = require("fs/promises");
const path = require("path");

// Folder penyimpanan akun, cookie, dan sesi Edge
const PROFILE_DIRECTORY = path.join(__dirname, "edge-profile");

// Konfigurasi
const BING_HOME = "https://www.bing.com/";
const SEARCH_DELAY = 5000;
const TYPING_DELAY = 70;

function waitForEnter() {
    return new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdin.once("data", () => resolve());
    });
}

async function readKeywords(filename) {
    const filePath = path.resolve(__dirname, filename);

    try {
        const content = await fs.readFile(filePath, "utf8");

        const keywords = content
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .map((keyword) => keyword.trim())
            .filter(Boolean);

        if (keywords.length === 0) {
            throw new Error("File TXT kosong atau tidak memiliki keyword.");
        }

        return keywords;
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new Error(`File tidak ditemukan: ${filePath}`);
        }

        throw error;
    }
}

async function launchEdge() {
    return chromium.launchPersistentContext(PROFILE_DIRECTORY, {
        channel: "msedge",
        headless: false,
        viewport: null,
        args: ["--start-maximized"]
    });
}

async function closeBingPopup(page) {
    const possibleButtons = [
        "#bnp_btn_accept",
        'button:has-text("Accept")',
        'button:has-text("Agree")',
        'button:has-text("Terima")',
        'button:has-text("Setuju")'
    ];

    for (const selector of possibleButtons) {
        const button = page.locator(selector).first();

        const visible = await button
            .isVisible()
            .catch(() => false);

        if (visible) {
            await button.click().catch(() => { });
            break;
        }
    }
}

async function getSearchBox(page) {
    // Selector utama dan alternatif untuk kotak pencarian Bing
    const searchBox = page
        .locator(
            [
                "#sb_form_q",
                'textarea[name="q"]',
                'input[name="q"]',
                'input[type="search"]'
            ].join(", ")
        )
        .first();

    await searchBox.waitFor({
        state: "visible",
        timeout: 15000
    });

    return searchBox;
}

async function searchFromSearchBox(page, keyword) {
    const searchBox = await getSearchBox(page);

    // Klik kotak pencarian
    await searchBox.click();

    // Pilih dan hapus tulisan pencarian sebelumnya
    await searchBox.press("Control+A");
    await searchBox.press("Backspace");

    // Mengetik karakter satu per satu
    await searchBox.pressSequentially(keyword, {
        delay: TYPING_DELAY
    });

    // Tekan Enter untuk mencari
    await searchBox.press("Enter");

    // Tunggu hasil pencarian selesai dimuat
    await page
        .waitForLoadState("domcontentloaded", {
            timeout: 30000
        })
        .catch(() => { });

    console.log(`Berhasil mencari: ${keyword}`);
}

async function loginMode() {
    let context;

    try {
        context = await launchEdge();

        const pages = context.pages();
        const page = pages[0] || await context.newPage();

        await page.goto(BING_HOME, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await closeBingPopup(page);

        console.log("\n======================================");
        console.log("MODE LOGIN AKUN");
        console.log("======================================");
        console.log("1. Login ke akun Microsoft Anda.");
        console.log("2. Selesaikan verifikasi jika muncul.");
        console.log("3. Pastikan akun berhasil masuk.");
        console.log("4. Kembali ke terminal.");
        console.log("5. Tekan ENTER untuk menyimpan sesi.");
        console.log("======================================\n");

        await waitForEnter();

        console.log("Sesi akun disimpan.");
    } catch (error) {
        console.error("Gagal menjalankan mode login:");
        console.error(error.message);
    } finally {
        if (context) {
            await context.close();
        }
    }
}

async function searchMode(filename) {
    let context;

    try {
        const keywords = await readKeywords(filename);

        console.log(`Jumlah pencarian: ${keywords.length}`);
        console.log(`File pencarian: ${filename}`);
        console.log(`Profil akun: ${PROFILE_DIRECTORY}\n`);

        context = await launchEdge();

        const pages = context.pages();
        const page = pages[0] || await context.newPage();

        // Hanya membuka halaman utama Bing,
        // bukan URL yang sudah berisi keyword
        await page.goto(BING_HOME, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await closeBingPopup(page);

        for (let index = 0; index < keywords.length; index++) {
            const keyword = keywords[index];

            console.log(
                `[${index + 1}/${keywords.length}] Mengetik: ${keyword}`
            );

            try {
                await searchFromSearchBox(page, keyword);
            } catch (error) {
                console.error(
                    `Gagal mencari "${keyword}": ${error.message}`
                );

                // Kembali ke halaman utama jika kotak pencarian bermasalah
                await page.goto(BING_HOME, {
                    waitUntil: "domcontentloaded",
                    timeout: 30000
                });

                await closeBingPopup(page);
            }

            if (index < keywords.length - 1) {
                console.log(
                    `Menunggu ${SEARCH_DELAY / 1000} detik...\n`
                );

                await page.waitForTimeout(SEARCH_DELAY);
            }
        }

        console.log("\nSemua pencarian selesai.");
        console.log("Tekan ENTER untuk menutup Edge.");

        await waitForEnter();
    } catch (error) {
        console.error("\nProgram gagal:");
        console.error(error.message);
    } finally {
        if (context) {
            await context.close();
        }
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--login")) {
        await loginMode();
        return;
    }

    const filename =
        args.find((argument) => !argument.startsWith("--")) ||
        "pencarian.txt";

    await searchMode(filename);
}

main().catch((error) => {
    console.error("Kesalahan tidak terduga:", error.message);
    process.exitCode = 1;
});