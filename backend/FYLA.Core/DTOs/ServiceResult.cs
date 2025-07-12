namespace FYLA.Core.DTOs;

public class ServiceResult<T>
{
  public bool IsSuccess { get; set; }
  public string? ErrorMessage { get; set; }
  public T? Data { get; set; }

  public static ServiceResult<T> Success(T data)
  {
    return new ServiceResult<T>
    {
      IsSuccess = true,
      Data = data
    };
  }

  public static ServiceResult<T> Failure(string errorMessage)
  {
    return new ServiceResult<T>
    {
      IsSuccess = false,
      ErrorMessage = errorMessage
    };
  }
}

public class ServiceResult
{
  public bool IsSuccess { get; set; }
  public string? ErrorMessage { get; set; }

  public static ServiceResult Success()
  {
    return new ServiceResult { IsSuccess = true };
  }

  public static ServiceResult Failure(string errorMessage)
  {
    return new ServiceResult
    {
      IsSuccess = false,
      ErrorMessage = errorMessage
    };
  }
}
