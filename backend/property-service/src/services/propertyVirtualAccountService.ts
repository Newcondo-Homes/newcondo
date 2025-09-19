import { PrismaClient, Prisma, VirtualAccount } from '@prisma/client';
import axios from 'axios';
import { FlutterwaveVirtualAccountConfig, VirtualAccountNaming } from '../../../payment-service/src/config/flutterwaveVirtualAccount';
import { 
  FlutterwaveVirtualAccountRequest,
  FlutterwaveVirtualAccountResponse,
  VirtualAccountCreationData,
  VirtualAccountType
} from '../../../shared/src/types/flutterwaveVirtualAccount';
import { 
  CreateVirtualAccountInput,
  VirtualAccountWithRelations,
  DefaultVirtualAccountNaming
} from '../../../../packages/db/types/virtual-account-extensions';

const prisma = new PrismaClient();

export class PropertyVirtualAccountService {
  private config = FlutterwaveVirtualAccountConfig.getInstance();
  private namingStrategy = new DefaultVirtualAccountNaming();

  /**
   * Create a virtual account for a property owner.
   * @param data - The data required to create the virtual account.
   * @returns The created virtual account with user and property relations.
   */
  async createPropertyOwnerVirtualAccount(data: CreateVirtualAccountInput): Promise<VirtualAccountWithRelations> {
    try {
      // Check if a virtual account already exists for this property owner and property
      const existingAccount = await this.findExistingVirtualAccount(data.userId, data.propertyId);
      if (existingAccount) {
        throw new Error('Virtual account already exists for this property owner');
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: { properties: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate a unique account name using the configured naming strategy
      const uniqueId = this.namingStrategy.generateUniqueIdentifier(data.userId, data.propertyId);
      const accountName = VirtualAccountNaming.generateAccountName(
        'PROPERTY_OWNER',
        data.ownerDetails.firstname,
        data.ownerDetails.lastname,
        uniqueId
      );

      // Validate the generated account name
      if (!VirtualAccountNaming.validateAccountName(accountName)) {
        throw new Error('Generated account name is invalid');
      }

      // Prepare the request payload for Flutterwave
      const flutterwaveRequest: FlutterwaveVirtualAccountRequest = {
        email: data.ownerDetails.email,
        is_permanent: true,
        phonenumber: data.ownerDetails.phone,
        firstname: data.ownerDetails.firstname,
        lastname: data.ownerDetails.lastname,
        narration: `Virtual account for ${accountName}`,
      };

      // Call the Flutterwave API to create the virtual account
      const flutterwaveResponse = await this.createFlutterwaveVirtualAccount(flutterwaveRequest);
      
      if (flutterwaveResponse.status !== 'success' || !flutterwaveResponse.data) {
        throw new Error(`Flutterwave account creation failed: ${flutterwaveResponse.message}`);
      }

      // Save the new virtual account to the database
      const virtualAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber: flutterwaveResponse.data.account_number,
          accountName: accountName,
          bankCode: this.config.virtualAccount.bankCode,
          userId: data.userId,
          propertyId: data.propertyId,
          flutterwaveAccountId: flutterwaveResponse.data.flw_ref,
          balance: 0,
          currency: this.config.virtualAccount.currency,
          isActive: true,
        },
        include: {
          user: true,
          property: true,
        },
      });

      console.log('Virtual account created successfully:', virtualAccount);
      return virtualAccount;
    } catch (error) {
      console.error('Error creating virtual account:', error);
      throw error;
    }
  }

  /**
   * Find an existing virtual account by user ID and property ID.
   * @param userId - The user's ID.
   * @param propertyId - The property's ID.
   * @returns The existing virtual account or null if not found.
   */
  private async findExistingVirtualAccount(userId: string, propertyId: string): Promise<VirtualAccount | null> {
    return prisma.virtualAccount.findFirst({
      where: {
        userId: userId,
        propertyId: propertyId,
        isActive: true,
      },
    });
  }

  /**
   * Internal method to call the Flutterwave virtual account creation API.
   * @param data - The request data for the Flutterwave API.
   * @returns The response from the Flutterwave API.
   */
  private async createFlutterwaveVirtualAccount(data: FlutterwaveVirtualAccountRequest): Promise<FlutterwaveVirtualAccountResponse> {
    try {
      const response = await axios.post<FlutterwaveVirtualAccountResponse>(
        `${this.config.baseUrl}/virtual-account-numbers`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Flutterwave API error:', error.response.data);
        throw new Error(`Flutterwave API error: ${error.response.data.message}`);
      }
      console.error('Network or unknown error:', error);
      throw new Error('An unexpected error occurred while calling the Flutterwave API');
    }
  }

  /**
   * Deactivates a virtual account both on our platform and with Flutterwave.
   * @param virtualAccountId - The ID of the virtual account to deactivate.
   */
  async deactivateVirtualAccount(virtualAccountId: string): Promise<VirtualAccount> {
    try {
      const account = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
      });

      if (!account) {
        throw new Error('Virtual account not found');
      }

      if (!account.isActive) {
        return account; // Already inactive, no need to proceed
      }

      // Call Flutterwave to deactivate the account
      await this.deactivateFlutterwaveAccount(account.flutterwaveAccountId);

      // Update the account status in the database
      const deactivatedAccount = await prisma.virtualAccount.update({
        where: { id: virtualAccountId },
        data: { isActive: false },
      });

      console.log('Virtual account deactivated successfully:', deactivatedAccount);
      return deactivatedAccount;
    } catch (error) {
      console.error('Error deactivating virtual account:', error);
      throw error;
    }
  }

  /**
   * Internal method to call the Flutterwave deactivate account API.
   * @param flutterwaveAccountId - The Flutterwave-specific account ID.
   */
  private async deactivateFlutterwaveAccount(flutterwaveAccountId: string): Promise<void> {
    try {
      await axios.put(
        `${this.config.baseUrl}/virtual-account-numbers/${flutterwaveAccountId}`,
        { status: 'inactive' },
        {
          headers: {
            Authorization: `Bearer ${this.config.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Flutterwave API deactivate error:', error.response.data);
        throw new Error(`Flutterwave API deactivate error: ${error.response.data.message}`);
      }
      console.error('Network or unknown error:', error);
      throw new Error('An unexpected error occurred while deactivating the Flutterwave account');
    }
  }

  /**
   * Finds a virtual account by its account number.
   * @param accountNumber - The virtual account number.
   * @returns The virtual account object or null.
   */
  async findVirtualAccountByAccountNumber(accountNumber: string): Promise<VirtualAccount | null> {
    try {
      return await prisma.virtualAccount.findUnique({
        where: { accountNumber: accountNumber },
      });
    } catch (error) {
      console.error('Error finding virtual account by number:', error);
      throw error;
    }
  }

  /**
   * Finds all active virtual accounts associated with a user.
   * @param userId - The ID of the user.
   * @returns An array of virtual account objects.
   */
  async findVirtualAccountsByUserId(userId: string): Promise<VirtualAccount[]> {
    try {
      return await prisma.virtualAccount.findMany({
        where: { userId: userId, isActive: true },
      });
    } catch (error) {
      console.error('Error finding virtual accounts for user:', error);
      throw error;
    }
  }
}