#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running Zephyr API tests...${NC}"
python test_api.py

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Tests completed successfully!${NC}"
else
    echo -e "\n${RED}Tests failed with errors.${NC}"
fi

read -p "Press Enter to continue..."
