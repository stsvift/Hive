using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using backend.Data;
using MySqlConnector;

namespace backend.Utils
{
    public class DatabaseInitializer
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DatabaseInitializer> _logger;
        private readonly string _connectionString;

        public DatabaseInitializer(
            AppDbContext context, 
            ILogger<DatabaseInitializer> logger, 
            string connectionString)
        {
            _context = context;
            _logger = logger;
            _connectionString = connectionString;
        }

        public async Task InitializeDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database initialization...");
                
                // Попытка создать базу данных напрямую
                await CreateDatabaseIfNotExistsAsync();
                
                // Удаление всех таблиц напрямую через SQL
                _logger.LogInformation("Dropping existing tables...");
                await ExecuteRawSqlAsync(@"
                    SET FOREIGN_KEY_CHECKS = 0;
                    
                    DROP TABLE IF EXISTS __EFMigrationsHistory;
                    DROP TABLE IF EXISTS FolderItems;
                    DROP TABLE IF EXISTS Tasks;
                    DROP TABLE IF EXISTS Notes;
                    DROP TABLE IF EXISTS Folders;
                    DROP TABLE IF EXISTS Users;
                    
                    SET FOREIGN_KEY_CHECKS = 1;
                ");
                
                // Создание схемы базы данных
                _logger.LogInformation("Creating database schema...");
                await _context.Database.EnsureCreatedAsync();
                
                _logger.LogInformation("Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing database");
                throw;
            }
        }
        
        private async Task CreateDatabaseIfNotExistsAsync()
        {
            try
            {
                // Получаем имя базы данных из строки подключения
                var builder = new MySqlConnectionStringBuilder(_connectionString);
                string databaseName = builder.Database;
                builder.Database = null; // удаляем имя БД, чтобы подключиться к серверу
                
                _logger.LogInformation($"Checking if database '{databaseName}' exists...");
                
                using var connection = new MySqlConnection(builder.ConnectionString);
                await connection.OpenAsync();
                
                string sql = $"CREATE DATABASE IF NOT EXISTS `{databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
                using var command = new MySqlCommand(sql, connection);
                await command.ExecuteNonQueryAsync();
                
                _logger.LogInformation($"Database '{databaseName}' created or confirmed existing");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating database");
                throw;
            }
        }
        
        private async Task ExecuteRawSqlAsync(string sql)
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(sql);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error executing SQL: {sql}");
                throw;
            }
        }
    }
}
