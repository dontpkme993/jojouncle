// api/data.js
module.exports = async(req, res) => {
	// 1. 設定快取 Header (我們討論過的 1秒保鮮, 10秒容許陳舊)
	res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=10');

	const token = process.env.NOTION_TOKEN;
	const databaseId = process.env.NOTION_DATABASE_ID;

	try {
		const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Notion-Version': '2022-06-28',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}), // 你可以在這裡加入 filter 或 sorts
		});

		const data = await response.json();

		// 2. 在後端就把資料「洗乾淨」，只傳回前端需要的欄位
		const cleanData = data.results.map(page => ({
			// id: page.id,
			name: page.properties.name.title[0] ? page.properties.name.title[0].plain_text : null,
			display_name: page.properties.display_name.rich_text[0] ? page.properties.display_name.rich_text[0].text.content : null,
			price: page.properties.price.number || 0,
			bottom: page.properties.bottom.number || 0,
			qty: page.properties.qty.number || 0,
			category: page.properties.category.multi_select.map(t => t.name)
		}));

		// 3. 回傳清洗後的資料
		res.status(200).json(cleanData);
	} catch (error) {
		res.status(500).json({
			error: 'Internal Server Error'
		});
	}
}