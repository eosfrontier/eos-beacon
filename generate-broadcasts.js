const fs = require('fs');
const path = require('path');

// Load the broadcasts configuration
const broadcastsConfig = require('./broadcasts-config.json');

// Template for the HTML files
const htmlTemplate = (title, embedCode, params) => `<title>${title}</title>
<div class="container-fluid">
	 <!-- When using a youtube link, src must be a youtube.com/embed link. 
	      Make sure after https://www.youtube.com/embed/xxxxxxx?si=yyyyyyyyy
              you always add &amp;controls=0&autoplay=1 and nothing else.-->
    <iframe
        style="width: 99%; min-height: 64vh; height: 100%; border-bottom: 1px solid #0B5E66; border-top: 1px solid #0B5E66"
	src="https://www.youtube.com/embed/${embedCode}${params}"
        title="${title} (YT)" frameborder="0" referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
    </iframe>
</div>
`;

// Output directory
const outputDir = path.join(__dirname, 'public', 'broadcasts', 'videos');

// Generate HTML files
broadcastsConfig.forEach(broadcast => {
  const filePath = path.join(outputDir, `${broadcast.name}.html`);
  const htmlContent = htmlTemplate(broadcast.title, broadcast.embedCode, broadcast.params);
  
  fs.writeFileSync(filePath, htmlContent, 'utf8');
  console.log(`✓ Generated ${broadcast.name}.html`);
});

console.log(`\nSuccessfully generated ${broadcastsConfig.length} broadcast file(s).`);
