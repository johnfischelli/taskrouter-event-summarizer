default: help
help:
	@echo "Make Targets:"
	@echo "            help: Shows this Help text"
	@echo "     build.<env>: Builds a local docker image"
	@echo "       run.<env>: Brings up all servers, workers, and databases in the active Terminal window (must be built first)"
	@echo "  buildrun.<env>: Builds and runs"
	@echo "      logs.<env>: Prints the logs from a given environment's container"
	@echo " logs.<env>.tail: Tails the logs from a given environment's container"
	@echo "   bashapp.<env>: Spawns a Bash terminal in an already-running environment"
	@echo "db.migrate.<env>: Performs all migrations in an already-running environment"
	@echo ""
	@echo "Available environments:"
	@echo "  - dev (default)"

db.migrate.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml exec app /app/node_modules/.bin/sequelize db:migrate
build.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml build
run.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml up -d
buildrun.dev: build.dev run.dev
logs.dev:_envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml logs
logs.dev.tail:_envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml logs -f
bashapp.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml exec app bash
kill.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml kill
down.dev: _envfile
	@env `cat config/development.env | xargs` docker-compose -f ./config/docker-compose-dev.yml down

build: build.dev
run: run.dev
kill: kill.dev
down: down.dev
buildrun: buildrun.dev
logs: logs.dev
logs.tail: logs.dev.tail
bashapp: bashapp.dev
db.migrate: db.migrate.dev

_envfile:
	@test -s config/development.env || { echo "'development.env' file must exist! Exiting."; exit 1; }
