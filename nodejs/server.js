const express = require('express');
const app = express();

app.use('/', express.static('www'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});