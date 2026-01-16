import app from './app.js';
import { CONFIG } from './config/index.js';

app.listen(CONFIG.PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Enterprise Backend Running (v1)`);
    console.log(`🔗 http://localhost:${CONFIG.PORT}`);
    console.log(`=================================`);
});
