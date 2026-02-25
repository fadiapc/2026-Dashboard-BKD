# WebApi

## Database

1. Setting database authentication -> **Windows Authentication**
2. In Databases folder, add new database "capstone"

## Initialisation
```bash
cp secret.json.example secret.json
type ./secret.json | dotnet user-secrets set --project WebApi
dotnet ef database update --project WebApi
```

## How to run server

```bash
dotnet run --project WebApi
```