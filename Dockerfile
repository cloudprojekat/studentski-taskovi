# ==========================================
# Faza 1: Builder (koristi standardnu Node sliku)
# ==========================================
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ==========================================
# Faza 2: Optimizovana produkcijska slika 
# ==========================================
# Koristimo Alpine verziju koja je drastično manja
FROM node:18-alpine 
WORKDIR /app
COPY package*.json ./
# Instaliramo samo produkcijske zavisnosti
RUN npm install --omit=dev
# Kopiramo kod iz builder faze
COPY --from=builder /app .

# Port na kom radi tvoja aplikacija
EXPOSE 4000 
CMD ["npm", "start"]