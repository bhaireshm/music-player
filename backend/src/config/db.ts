import mongoose from 'mongoose';

/**
 * Connect to MongoDB with retry logic
 * Implements connection error handling and automatic retry on failure
 */
export async function connectDB(): Promise<void> {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  let retries = 0;

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  while (retries < maxRetries) {
    try {
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error);

      if (retries >= maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB.');
        throw new Error('Failed to connect to MongoDB after multiple attempts');
      }

      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Handle MongoDB connection events
 */
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});
