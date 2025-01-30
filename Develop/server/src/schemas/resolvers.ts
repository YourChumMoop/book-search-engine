import { User } from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';

interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string;
    }
}

interface LoginUserArgs {
    email: string;
    password: string;
}

interface UserArgs {
    username: string;
}

interface BookArgs {
    bookId: string;
}

interface SaveBookArgs {
    input: {
        bookId: string;
        title: string;
        authors: string[];
        description: string;
        image: string;
        link: string;
    }
}

const resoslvers = {
    Query: {
        users: async () => {
            return User.find().populate('savedBooks')
        },
        user: async (_parent: any, { username }: UserArgs) => {
            return User.findOne({ username }).populate('savedBooks')
        },
        me: async (_parent: any, _args: any, context: any) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('Could not authenticate');
        },
    },
    Mutation: {
        addUser: async (_parent: any, { input }: AddUserArgs) => {
            const user = await User.create({ ...input });

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        login: async (_parent: any, { email, password }: LoginUserArgs) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('user not found with email provided');
            }

            const correctPassword = await user.isCorrectPassword(password);

            if (!correctPassword) {
                throw new AuthenticationError('incorrect Password');
            }

            const token = signToken(user.username, user.email, user._id);

            return { token, user };
        },
        saveBook: async (_parent: any, { input }: SaveBookArgs, context: any) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {
                        $addToSet: {
                            savedBooks: {
                                input
                            }
                        }
                    }
                );
                return updatedUser;
            }
            throw new AuthenticationError('you need to be logged in!');
        },
        removeBook: async (_parent: any, {bookId}:BookArgs, context: any) => {
            if(context.user){
                
                const updatedUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    { $pull: { savedBooks: bookId}}
                );
                if(!updatedUser){
                    throw AuthenticationError;
                }
                return updatedUser;
            }
            throw AuthenticationError;
        }
    }
};

export default resoslvers;