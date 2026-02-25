CENTRALSERVER_DIR = central-server/admin-frontend
TERMINALAPP_DIR = terminal-app/terminal-frontend

.PHONY: all
all: build

.PHONY: central-build, terminal-build
central-build:
	cd $(CENTRALSERVER_DIR) && npm install && npm run build

terminal-build:
	cd $(TERMINALAPP_DIR) && npm install && npm run build

.PHONY: central-dev, terminal-dev
central-dev:
	cd $(CENTRALSERVER_DIR) && npm install && npm run dev
	
terminal-dev:
	cd $(TERMINALAPP_DIR) && npm install && npm run dev

.PHONY: central-run,terminal-run
central-run:
	cd $(CENTRALSERVER_DIR) && npm run dev

terminal-run:
	cd $(TERMINALAPP_DIR) && npm run dev

.PHONY: clean
clean:
	cd $(CENTRALSERVER_DIR) && rm -rf node_modules dist
	cd $(TERMINALAPP_DIR) && rm -rf node_modules dist

generate-central-client:
	@echo "Generating unified TypeScript Client..."
	@mkdir -p central-server/admin-frontend/src/client
	@docker build -t openapi-generator ./central-server/openapi-generator
	@docker run --rm -v $(PWD)/central-server:/workspace -w /workspace/openapi-generator openapi-generator
	@echo "TypeScript Client Generated Successfully."



