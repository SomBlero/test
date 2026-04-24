using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql;
using RaktarProjekt.Models;
using RaktarProjekt.Database;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using RaktarProjekt.Service;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var smtpEnabled = builder.Configuration.GetValue<bool>("Smtp:Enabled");
var smtpHost = builder.Configuration["Smtp:Host"] ?? "(nincs megadva)";
var smtpUser = builder.Configuration["Smtp:User"] ?? "(nincs megadva)";
Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STARTUP] Kornyezet: {builder.Environment.EnvironmentName}");
Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STARTUP] SMTP Enabled: {smtpEnabled}, Host: {smtpHost}, User: {smtpUser}");
var connectionString = ConnectionResolverService.GetWorkingConnectionString(builder.Configuration);

builder.Services.AddDbContext<RaktarContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
builder.Services.AddControllers().AddJsonOptions(x =>
                x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
builder.Services.AddScoped<TokenManager>();     
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PdfGeneratorService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
            throw new InvalidOperationException("Hiányzik a Jwt:Key konfiguráció.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHostedService<NyitoKodCleanupService>();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers["Pragma"] = "no-cache";
        ctx.Context.Response.Headers["Expires"] = "0";
    }
});

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

try
{
    app.Run();
}
catch (IOException ex) when (ex.Message.Contains("address already in use", StringComparison.OrdinalIgnoreCase))
{
    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STARTUP] [ERROR] A 7195-os port mar foglalt. Valoszinuleg mar fut egy masik RaktarProjekt peldany.");
    Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] [STARTUP] [ERROR] Allitsd le a korabbi peldanyt, es csak utana indits ujra.");
}

