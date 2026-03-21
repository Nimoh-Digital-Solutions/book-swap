.DEFAULT: start



start: # start both the BE server and the FE server
	@echo "Starting the BE server and the FE server..."
	@cd backend && make dev
	@echo "BE server started."
	@cd frontend && make docker-dev
	@echo "FE server started."