using MySql.Data.MySqlClient;
using MySqlConnector;

namespace RaktarProjekt.Service
{
    public static class ConnectionResolverService
    {
        public static string GetWorkingConnectionString(IConfiguration config)
        {
            var conn3306 = config.GetConnectionString("Default3306");
            var conn3307 = config.GetConnectionString("Default3307");

            if (!string.IsNullOrWhiteSpace(conn3306) && TestConnection(conn3306))
                return conn3306;

            if (!string.IsNullOrWhiteSpace(conn3307) && TestConnection(conn3307))
                return conn3307;

            throw new Exception("--------------------\n\tNem sikerült csatlakozni sem a 3306, sem a 3307 porton.\n--------------------");
        }

        private static bool TestConnection(string connectionString)
        {
            try
            {
                using var conn = new MySql.Data.MySqlClient.MySqlConnection(connectionString);
                conn.Open();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}