// 共享的 Markdown → Sanity Block Content 转换
// 被 generate-content 和 platform-content 两个 API 使用

export function convertToBlockContent(markdown: string) {
  const lines = markdown.split('\n');
  const blocks = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      blocks.push({
        _type: 'block',
        style: 'h1',
        children: [{ _type: 'span', text: line.substring(2) }]
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: line.substring(3) }]
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: line.substring(4) }]
      });
    } else if (line.match(/!\[.*\]\(.*\)/)) {
      const imageMatch = line.match(/!\[(.*)\]\((.*)\)/);
      if (imageMatch) {
        blocks.push({
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{
            _type: 'span',
            text: `![${imageMatch[1]}](${imageMatch[2]})`,
            marks: []
          }]
        });
      }
    } else if (line.trim()) {
      blocks.push({
        _type: 'block',
        style: 'normal',
        children: parseInlineMarkdown(line)
      });
    }
  }

  return blocks;
}

function parseInlineMarkdown(text: string) {
  return [{ _type: 'span', text }];
}
