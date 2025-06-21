
echo "测试 /api/dogs:"
curl -s http://localhost:3000/api/dogs | jq

echo -e "\n测试 /api/walkrequests/open:"
curl -s http://localhost:3000/api/walkrequests/open | jq

echo -e "\n测试 /api/walkers/summary:"
curl -s http://localhost:3000/api/walkers/summary | jq