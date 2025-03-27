using backend.Data;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("Connection string is not configured");
}

// Add services to the container
builder.Services.AddMemoryCache();

// Настройка подключения к базе данных
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, 
        ServerVersion.AutoDetect(connectionString),
        o => 
        {
            o.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            o.CommandTimeout(30);
        }));

// Регистрация AuthService
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<FolderService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<NoteService>();
builder.Services.AddScoped<UserService>();

// Настройка CORS для разрешения запросов с локального клиента
var corsOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>() ?? 
    new string[] { "http://localhost:5173" }; // Default if configuration is missing

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
    
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? 
                throw new Exception("JWT Secret key not found in environment variables"))),
            ValidateIssuer = false,
            ValidateAudience = false
        });

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(); // Для использования Swagger

var app = builder.Build();

// Включаем CORS - используем политику по умолчанию
app.UseCors();

app.UseRouting();
app.UseAuthentication(); // Add this line to ensure authentication is set up before authorization
app.UseAuthorization();

// Включаем Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Добавляем простой ответ для корневого пути API
app.MapGet("/api", () => Results.Ok(new { message = "API is working" }));

// Добавляем эндпоинт проверки состояния (убедитесь, что он работает)
app.MapGet("/api/health", () => {
    Console.WriteLine("Health check endpoint called");
    return Results.Ok(new { status = "healthy" });
});

app.MapControllers();

app.Run();
