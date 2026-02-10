module.exports = async(req, res) => {
	// 1. 設定快取 Header
	res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=60');

	const token = process.env.NOTION_TOKEN;
	const databaseId = process.env.NOTION_DATABASE_ID;

	try {
		let allResults = [];
		let hasMore = true;
		let nextCursor = undefined;

		// --- 開始分頁撈取 ---
		while (hasMore) {
			const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Notion-Version': '2022-06-28',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sorts: [{
						property: 'idx',
						direction: 'ascending'
					}],
					start_cursor: nextCursor, // 告訴 Notion 從哪裡接續
					page_size: 100 // 每次最多撈 100
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Notion API Error');
			}

			// 把這一批的結果塞進總陣列
			allResults = allResults.concat(data.results);

			// 更新迴圈條件
			hasMore = data.has_more;
			nextCursor = data.next_cursor;
		}
		// --- 分頁撈取結束 ---

		// 2. 在後端把「所有」抓到的資料洗乾淨
		const cleanData = allResults.map(page => ({
			name: page.properties.name.title[0] ? page.properties.name.title[0].plain_text : null,
			display_name: page.properties.display_name.rich_text[0] ? page.properties.display_name.rich_text[0].text.content : null,
			price: page.properties.price.number || 0,
			bottom: page.properties.bottom.number || 0,
			qty: page.properties.qty.rich_text[0] ? page.properties.qty.rich_text[0].text.content : null,
			category: page.properties.category.multi_select.map(t => t.name)
		}));

		// 3. 回傳完整資料
		res.status(200).json(cleanData);

	} catch (error) {
		console.error(error); // 這樣你在 Vercel Logs 才看得到具體報錯
		res.status(500).json({
			error: 'Internal Server Error',
			message: error.message
		});
	}
}