# Master-rad
## Implementacija decentralizovanog tržišta nezamenjivih tokena u industriji video igara

### Tehnologije
Projekat koristi sledeće tehnologije:
- **Solidity**: Jezik za pisanje pametnih ugovora.
- **Hardhat**: Okruženje za razvoj, testiranje i postavljanje pametnih ugovora na Ethereum blokčejnu.
- **Chai**: Biblioteka za pisanje testova koja omogućava lakše testiranje pametnih ugovora.

### Postavljanje okruženja
Da biste postavili okruženje, pratite sledeće korake:

1. Pozicionirajte se u koreni folder projekta.
2. Instalirajte potrebne biblioteke: ```npm install```
3. Podignite lokalni čvor Ethereum blokčejna:
```npx hardhat node```
4. Otvorite novu instancu terminala.
5. Postavite pametne ugovore na blokčejn: ```npx hardhat run ./src/backend/scripts/deploy.js --network localhost```
6. Pokrenite Hardhat konzolu:
```npx hardhat console```

Sada možete vršiti interakciju sa pametnim ugovorima na lokalnom blokčejnu koristeći adrese koje su kreirane prilikom postavljanja pametnih ugovora.
