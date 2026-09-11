class Server {
    constructor(id, maxCapacity) {
        this.id = id;
        this.maxCapacity = maxCapacity;
        this.activeConnections = 0;
    }

    async processRequest(requestId, logger) {
        if (this.activeConnections >= this.maxCapacity) {
            logger.log(`[Request ${requestId}] Rejected by Server ${this.id} (At Max Capacity)`, 'warning');
            return false;
        }

        this.activeConnections++;
        this.updateUI();

        logger.log(`[Request ${requestId}] Routed to Server ${this.id}`);

        const load = this.getLoadPercentage();
        if (load >= 90) {
            logger.log(`[WARNING] Server ${this.id} CPU load is at ${Math.round(load)}% (Approaching 100%)`, 'warning');
        }

        // Simulate random processing time between 500ms and 3000ms
        const processingTime = Math.floor(Math.random() * 2500) + 500;

        return new Promise((resolve) => {
            setTimeout(() => {
                this.activeConnections--;
                this.updateUI();
                logger.log(`[Request ${requestId}] Completed by Server ${this.id} in ${processingTime}ms`);
                resolve(true);
            }, processingTime);
        });
    }

    getLoadPercentage() {
        return (this.activeConnections / this.maxCapacity) * 100;
    }

    updateUI() {
        const load = this.getLoadPercentage();
        const loadText = document.getElementById(`server-${this.id}-load-text`);
        const progressBar = document.getElementById(`server-${this.id}-progress`);
        const serverCard = document.getElementById(`server-${this.id}-card`);

        if(loadText && progressBar && serverCard) {
            loadText.innerText = `${this.activeConnections} / ${this.maxCapacity} (${Math.round(load)}%)`;
            progressBar.style.width = `${Math.min(load, 100)}%`;

            if (load >= 90) {
                progressBar.classList.add('warning');
                serverCard.classList.add('warning');
            } else {
                progressBar.classList.remove('warning');
                serverCard.classList.remove('warning');
            }
        }
    }
}

class LoadBalancer {
    constructor(servers) {
        this.servers = servers;
    }

    // Least Connections Algorithm
    getNextServer() {
        return this.servers.reduce((prev, curr) => {
            return (prev.activeConnections < curr.activeConnections) ? prev : curr;
        });
    }
}

class Logger {
    constructor(logPanelId) {
        this.logPanel = document.getElementById(logPanelId);
    }

    log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        entry.innerText = `[${timestamp}] ${message}`;

        this.logPanel.appendChild(entry);
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }

    clear() {
        this.logPanel.innerHTML = '';
    }
}

// Initialization
const NUM_SERVERS = 3;
const SERVER_CAPACITY = 18; // Max requests per server
const TOTAL_REQUESTS = 50;

const servers = [];
const logger = new Logger('logPanel');

// Setup UI and Servers
const serverContainer = document.getElementById('serverContainer');
for (let i = 1; i <= NUM_SERVERS; i++) {
    const server = new Server(i, SERVER_CAPACITY);
    servers.push(server);

    // Create UI elements for the server
    const card = document.createElement('div');
    card.className = 'server-card';
    card.id = `server-${i}-card`;
    card.innerHTML = `
        <h3>Server ${i}</h3>
        <p>Active Connections: <span id="server-${i}-load-text">0 / ${SERVER_CAPACITY} (0%)</span></p>
        <div class="progress-bar-container">
            <div class="progress-bar" id="server-${i}-progress"></div>
        </div>
    `;
    serverContainer.appendChild(card);
}

const loadBalancer = new LoadBalancer(servers);

// Start Simulation
document.getElementById('startBtn').addEventListener('click', async () => {
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    logger.clear();
    logger.log('--- Simulation Started ---');

    const requests = [];

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        // Find best server via load balancer
        const targetServer = loadBalancer.getNextServer();

        // Dispatch request
        requests.push(targetServer.processRequest(i, logger));

        // Add a small delay between incoming requests to see the load balancing in action

    }

    // Wait for all requests to finish
    await Promise.all(requests);
    logger.log('--- Simulation Completed ---');
    startBtn.disabled = false;
});
