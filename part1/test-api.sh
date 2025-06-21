
echo "test/api/dogs:"
curl -s http://localhost:3000/api/dogs | jq

echo -e "\ntest /api/walkrequests/open:"
curl -s http://localhost:3000/api/walkrequests/open | jq

echo -e "\ntest /api/walkers/summary:"
curl -s http://localhost:3000/api/walkers/summary | jq