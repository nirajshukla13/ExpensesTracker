import requests
r = requests.options('http://localhost:8000/api/dashboard/stats', headers={'Origin':'http://localhost:3000','Access-Control-Request-Method':'GET'})
print(r.status_code)
print(r.headers)
