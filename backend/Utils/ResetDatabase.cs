using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using backend.Data;
using backend.Utils;
using DotNetEnv;

namespace backend.Utils
{
    public class ResetDatabase
    {
        public static async Task Main(string[] args)
        {
            Console.WriteLine("Starting database reset utility...");
            
            // Загружаем переменные окружения
            Env.Load();
            
            // Получаем строку подключения
            string connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
            {
                Console.WriteLine("ERROR: Connection string not found! Make sure ConnectionStrings__DefaultConnection is set in .env file");
                return;
            }
            
            Console.WriteLine("Connection string loaded");
            
            // Создаем сервисы
            var services = new ServiceCollection();
            services.AddLogging(builder => 
            {
                builder.AddConsole();
                builder.SetMinimumLevel(LogLevel.Information);
            });
            
            services.AddDbContext<AppDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
                
            services.AddSingleton(sp => new DatabaseInitializer(
                sp.GetRequiredService<AppDbContext>(),
                sp.GetRequiredService<ILogger<DatabaseInitializer>>(),
                connectionString));
                
            var serviceProvider = services.BuildServiceProvider();
            
            // Получаем инициализатор БД
            var initializer = serviceProvider.GetRequiredService<DatabaseInitializer>();
            
            Console.WriteLine("Are you sure you want to reset the database? All data will be lost. (y/n)");
            var response = Console.ReadLine()?.ToLower();
            
            if (response == "y" || response == "yes")
            {
                Console.WriteLine("Resetting database...");
                try
                {
                    await initializer.InitializeDatabaseAsync();
                    Console.WriteLine("Database has been reset successfully!");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERROR: {ex.Message}");
                    Console.WriteLine(ex.StackTrace);
                }
            }
            else
            {
                Console.WriteLine("Database reset cancelled.");
            }
        }
    }
}
