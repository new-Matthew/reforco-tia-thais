# syntax=docker/dockerfile:1

# ----------------------------- Build stage -----------------------------
FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /app

# Copia primeiro apenas os arquivos do Maven Wrapper e o pom.xml.
# Assim, o download das dependências fica em cache enquanto o código não muda.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

# Copia o código-fonte e gera o jar executável.
COPY src ./src
RUN ./mvnw clean package -DskipTests

# ---------------------------- Runtime stage ----------------------------
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Executa a aplicação com um usuário sem privilégios.
RUN groupadd --system app && useradd --system --gid app app

COPY --from=build --chown=app:app /app/target/*.jar app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
