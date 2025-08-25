# Copy example environment file
cp .env.example .env

# Create data directory for SQLite
mkdir -p data

# Create logs directory
mkdir -p logs

echo "✅ Server setup complete!"
echo "📝 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Run 'npm run dev' to start development server"
echo "   3. Run 'npm start' for production"
echo ""
echo "🌐 Server will be available at: http://localhost:3000"
echo "📋 API documentation: http://localhost:3000/api"
echo "💓 Health check: http://localhost:3000/health"
